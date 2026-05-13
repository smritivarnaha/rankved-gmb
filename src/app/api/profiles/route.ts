import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getAllProfiles, saveProfiles, deleteProfile, ProfileData } from "@/lib/profile-store";

// Helper: delay to avoid rate limits
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Helper: fetch with exponential backoff retry on 429
async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 3): Promise<Response> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch(url, options);

    if (response.status === 429 && attempt < maxRetries) {
      const retryAfter = response.headers.get("Retry-After");
      const waitMs = retryAfter ? parseInt(retryAfter) * 1000 : 2000 * Math.pow(2, attempt);
      console.log(`Rate limited, retrying in ${waitMs}ms (attempt ${attempt + 1}/${maxRetries})`);
      await delay(waitMs);
      continue;
    }

    return response;
  }

  return fetch(url, options);
}

// GET /api/profiles — list saved profiles
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session as any).user.id;
  const role = (session as any).user.role;
  const ownerId = (session as any).user.ownerId;

  const profiles = await getAllProfiles(userId, role, ownerId);
  return NextResponse.json({ data: profiles });
}

// POST /api/profiles — fetch from Google API and save
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session as any)?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Could not determine user ID from session." }, { status: 401 });
  }

  // Use the new utility to get all valid, non-expired Google accounts
  const { getValidGoogleAccounts, getEmailFromIdToken } = await import("@/lib/google-accounts");
  const validAccounts = await getValidGoogleAccounts(userId);
  
  if (validAccounts.length === 0) {
    return NextResponse.json({ error: "No valid Google accounts connected. Please connect a Google account in Settings first." }, { status: 400 });
  }

  try {
    const fetchedProfiles: ProfileData[] = [];

    // Iterate over each connected Google account
    for (const validAccount of validAccounts) {
      const accessToken = validAccount.access_token;
      if (!accessToken) continue;
      const accountEmail = getEmailFromIdToken(validAccount.id_token) || "Unknown Account";

      // Step 1: Get all GBP accounts (with retry)
      const accountsRes = await fetchWithRetry("https://mybusinessaccountmanagement.googleapis.com/v1/accounts", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!accountsRes.ok) {
        const err = await accountsRes.json().catch(() => ({}));
        console.warn(`[Google Sync] Failed to fetch accounts for provider ID ${validAccount.providerAccountId}:`, err?.error?.message || accountsRes.status);
        continue;
      }

      const accountsData = await accountsRes.json();
      const accounts = accountsData.accounts || [];

      if (accounts.length === 0) {
        continue;
      }

      // Step 2: For each account, get locations (with delay between each to avoid rate limits)
      for (let i = 0; i < accounts.length; i++) {
        const account = accounts[i];
        const accountName = account.name;
        const accountDisplayName = account.accountName || account.name;

        if (i > 0 || fetchedProfiles.length > 0) await delay(1500);

        try {
          let pageToken: string | undefined = undefined;
          
          do {
            const url = new URL(`https://mybusinessbusinessinformation.googleapis.com/v1/${accountName}/locations`);
            url.searchParams.set("readMask", "name,title,storefrontAddress,phoneNumbers,websiteUri");
            url.searchParams.set("pageSize", "100");
            if (pageToken) url.searchParams.set("pageToken", pageToken);

            const locationsRes = await fetchWithRetry(url.toString(), { 
              headers: { Authorization: `Bearer ${accessToken}` } 
            });

            if (locationsRes.ok) {
              const locData = await locationsRes.json();
              const locations = locData.locations || [];
              pageToken = locData.nextPageToken;

              for (const loc of locations) {
                // Throttle per location to avoid media API rate limits
                await delay(1000);

                const addressParts = loc.storefrontAddress || {};
                const addressLines = [
                  ...(addressParts.addressLines || []),
                  addressParts.locality || "",
                  addressParts.administrativeArea || "",
                  addressParts.postalCode || "",
                ].filter(Boolean);

                // ─── ULTIMATE LOGO FETCH (PATTERN MATCHING + MAPS FALLBACK) ───
                let logoUrl: string | undefined;
                try {
                  const v4FullName = loc.name.startsWith("accounts/") ? loc.name : `${accountName}/${loc.name}`;
                  const v4ShortName = loc.name; // locations/{id}
                  const placeId = loc.metadata?.placeId;
                  
                  // Pattern 1: Business Profile Media API (v4)
                  const urlsToTry = [
                    `https://mybusiness.googleapis.com/v4/${v4FullName}/media?maxResults=50`,
                    `https://mybusiness.googleapis.com/v4/${v4ShortName}/media?maxResults=50`,
                    `https://mybusiness.googleapis.com/v4/${accountName}/media?maxResults=100`
                  ];

                  let allFoundItems: any[] = [];
                  for (const url of urlsToTry) {
                    const res = await fetchWithRetry(url, { headers: { Authorization: `Bearer ${accessToken}` } });
                    if (res.ok) {
                      const json = await res.json();
                      const items = json.mediaItems || json.media || [];
                      if (items.length > 0) {
                        if (url.includes("/media?maxResults=100")) {
                          const filtered = items.filter((m: any) => 
                            m.locationAssociation?.locationName === v4FullName ||
                            m.locationAssociation?.locationName === v4ShortName ||
                            m.name?.includes(v4ShortName)
                          );
                          allFoundItems = [...allFoundItems, ...filtered];
                        } else {
                          allFoundItems = [...allFoundItems, ...items];
                        }
                      }
                    }
                    if (allFoundItems.length > 10) break;
                  }

                  if (allFoundItems.length > 0) {
                    const bestMatch = allFoundItems.find((m: any) => ["LOGO", "PROFILE", "COVER"].includes(m.locationAssociation?.category?.toUpperCase()))
                                   || allFoundItems.find((m: any) => ["LOGO", "PROFILE", "COVER"].includes(m.category?.toUpperCase()))
                                   || allFoundItems[0];

                    const rawUrl = bestMatch?.googleUrl || bestMatch?.thumbnailUrl || bestMatch?.contentUrl;
                    if (rawUrl) {
                      logoUrl = rawUrl.split("=")[0] + "=s400";
                    }
                  }

                  // ─── FAIL-SAFE: GOOGLE PLACES API (MAPS) ───
                  // If Media API is empty but we have a Place ID, fetch from Google Maps directly
                  if (!logoUrl && placeId && process.env.GOOGLE_MAPS_API_KEY) {
                    const apiKey = process.env.GOOGLE_MAPS_API_KEY.replace(/["\s\\]/g, "");
                    const placeUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=photos&key=${apiKey}`;
                    const placeRes = await fetch(placeUrl);
                    if (placeRes.ok) {
                      const placeData = await placeRes.json();
                      const photo = placeData.result?.photos?.[0];
                      if (photo?.photo_reference) {
                        logoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${photo.photo_reference}&key=${apiKey}`;
                        console.log(`[Google Sync] 📍 MAPS FALLBACK for ${loc.title}: ${logoUrl}`);
                      }
                    }
                  }

                  if (logoUrl) {
                    console.log(`[Google Sync] 🎯 SUCCESS for ${loc.title}: ${logoUrl}`);
                  }
                } catch (err: any) {
                  console.error(`[Google Sync] ❌ Ultimate fetch failed:`, err.message);
                }

                fetchedProfiles.push({
                  id: crypto.randomUUID(),
                  name: loc.title || "Unnamed Location",
                  accountId: accountName,
                  accountName: accountDisplayName,
                  address: addressLines.join(", "),
                  phone: loc.phoneNumbers?.primaryPhone || "",
                  website: loc.websiteUri || "",
                  googleName: loc.name || "",
                  logoUrl,
                  googleEmail: accountEmail,
                  fetchedAt: new Date().toISOString(),
                });
              }
            } else {
              break; // Stop on error
            }
          } while (pageToken);
        } catch (err: any) {
          console.warn(`Error fetching locations for ${accountName}:`, err.message);
        }
      }
    }

    if (fetchedProfiles.length === 0) {
      return NextResponse.json({ error: "No profiles found across any connected Google accounts." }, { status: 404 });
    }

    const ownerId = (session as any)?.user?.ownerId;
    await saveProfiles(fetchedProfiles, userId, ownerId);

    return NextResponse.json({ data: fetchedProfiles, message: `${fetchedProfiles.length} profiles fetched from Google.` });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch profiles from Google" }, { status: 500 });
  }
}

// DELETE /api/profiles?id=xxx — remove a synced profile (admin only)
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session as any)?.user?.role;
  const allowedRoles = ["SUPER_ADMIN", "AGENCY_OWNER", "TEAM_MEMBER"];
  if (!allowedRoles.includes(role)) {
    return NextResponse.json({ error: "You do not have permission to delete profiles." }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Profile ID required" }, { status: 400 });

  const success = await deleteProfile(id);
  if (!success) return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}

// PATCH /api/profiles — update a profile (e.g. custom logo)
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session as any)?.user?.role;
  const allowedRoles = ["SUPER_ADMIN", "AGENCY_OWNER", "TEAM_MEMBER"];
  if (!allowedRoles.includes(role)) {
    return NextResponse.json({ error: "Permission denied" }, { status: 403 });
  }

  try {
    const formData = await req.formData();
    const id = formData.get("id") as string;
    const logoFile = formData.get("logo") as File | null;

    if (!id) return NextResponse.json({ error: "Profile ID required" }, { status: 400 });

    let base64Logo = undefined;
    if (logoFile && logoFile.size > 0) {
      const bytes = await logoFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      base64Logo = `data:${logoFile.type};base64,${buffer.toString("base64")}`;
    }

    if (base64Logo) {
      const prisma = (await import("@/lib/prisma")).default;
      await prisma.location.update({
        where: { id },
        data: { logoUrl: base64Logo }
      });
    }

    return NextResponse.json({ success: true, message: "Profile updated successfully" });
  } catch (err: any) {
    console.error("Error updating profile:", err);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
