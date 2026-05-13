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
            url.searchParams.set("readMask", "name,title,storefrontAddress,phoneNumbers,websiteUri,metadata");
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

                // ── LOGO FETCH: 3-strategy approach ──────────────────────────
                let logoUrl: string | undefined;
                const placeId = loc.metadata?.placeId;

                try {
                  // Strategy 1: Places API (New) with user's OAuth token — no extra API key needed
                  if (placeId && !logoUrl) {
                    const placesRes = await fetch(
                      `https://places.googleapis.com/v1/places/${placeId}`,
                      {
                        headers: {
                          Authorization: `Bearer ${accessToken}`,
                          "X-Goog-FieldMask": "photos",
                        },
                      }
                    );
                    if (placesRes.ok) {
                      const placesData = await placesRes.json();
                      const photoName = placesData.photos?.[0]?.name;
                      if (photoName) {
                        // photo name looks like: places/{placeId}/photos/{photoRef}
                        const mapsKey = (process.env.GOOGLE_MAPS_API_KEY || "").replace(/["\s\\]/g, "");
                        if (mapsKey) {
                          logoUrl = `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=400&key=${mapsKey}`;
                        } else {
                          // Construct URL using OAuth — fetch photo bytes via redirect
                          logoUrl = `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=400&skipHttpRedirect=false`;
                        }
                        console.log(`[Sync] ✅ Places API (New) for "${loc.title}": ${photoName}`);
                      }
                    } else {
                      const t = await placesRes.text();
                      console.warn(`[Sync] Places (New) failed for "${loc.title}": ${placesRes.status} — ${t.slice(0, 120)}`);
                    }
                  }

                  // Strategy 2: Classic Places API with Maps API key
                  if (placeId && !logoUrl) {
                    const mapsKey = (process.env.GOOGLE_MAPS_API_KEY || "").replace(/["\s\\]/g, "");
                    if (mapsKey) {
                      const detailsRes = await fetch(
                        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=photos&key=${mapsKey}`
                      );
                      if (detailsRes.ok) {
                        const det = await detailsRes.json();
                        const ref = det.result?.photos?.[0]?.photo_reference;
                        if (ref) {
                          logoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${ref}&key=${mapsKey}`;
                          console.log(`[Sync] ✅ Classic Places for "${loc.title}"`);
                        } else {
                          console.warn(`[Sync] Classic Places: no photo_reference for "${loc.title}" — status: ${det.status}`);
                        }
                      }
                    }
                  }

                  // Strategy 3: GBP Media API v4 (last resort)
                  if (!logoUrl) {
                    const v4Name = loc.name.startsWith("accounts/") ? loc.name : `${accountName}/${loc.name}`;
                    const mediaRes = await fetchWithRetry(
                      `https://mybusiness.googleapis.com/v4/${v4Name}/media?maxResults=20`,
                      { headers: { Authorization: `Bearer ${accessToken}` } }
                    );
                    if (mediaRes.ok) {
                      const { mediaItems = [] } = await mediaRes.json();
                      const best = mediaItems.find((m: any) =>
                        ["LOGO", "PROFILE", "COVER"].includes((m.category || m.locationAssociation?.category || "").toUpperCase())
                      ) || mediaItems[0];
                      const raw = best?.googleUrl || best?.thumbnailUrl;
                      if (raw) {
                        logoUrl = raw.split("=")[0] + "=s400";
                        console.log(`[Sync] ✅ GBP Media for "${loc.title}"`);
                      } else {
                        console.warn(`[Sync] GBP Media: no items for "${loc.title}"`);
                      }
                    } else {
                      console.warn(`[Sync] GBP Media failed for "${loc.title}": ${mediaRes.status}`);
                    }
                  }

                  if (!logoUrl) {
                    console.warn(`[Sync] ❌ No logo for "${loc.title}" | placeId: ${placeId} | loc: ${loc.name}`);
                  }
                } catch (err: any) {
                  console.error(`[Sync] ❌ Logo error for "${loc.title}":`, err.message);
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
