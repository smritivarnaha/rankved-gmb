// Extend Vercel function timeout to 60s for large account syncs
export const maxDuration = 60;

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

      // Step 1: Get all GBP accounts
      const accountsRes = await fetchWithRetry("https://mybusinessaccountmanagement.googleapis.com/v1/accounts", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!accountsRes.ok) continue;

      const accountsData = await accountsRes.json();
      const accounts = accountsData.accounts || [];

      // Step 2: For each account, get locations
      for (let i = 0; i < accounts.length; i++) {
        const account = accounts[i];
        const accountName = account.name;
        const accountDisplayName = account.accountName || account.name;

        if (i > 0 || fetchedProfiles.length > 0) await delay(200);

        try {
          let pageToken: string | undefined = undefined;
          
          do {
            const url = new URL(`https://mybusinessbusinessinformation.googleapis.com/v1/${accountName}/locations`);
            // IMPORTANT: 'metadata' must be in readMask to get placeId for logo lookup
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
                await delay(100);

                const addressParts = loc.storefrontAddress || {};
                const addressLines = [
                  ...(addressParts.addressLines || []),
                  addressParts.locality || "",
                  addressParts.administrativeArea || "",
                  addressParts.postalCode || "",
                ].filter(Boolean);

                let logoUrl: string | undefined;
                const placeId = loc.metadata?.placeId;

                try {
                  const mapsKey = (process.env.GOOGLE_MAPS_API_KEY || "").replace(/["\s\\]/g, "");

                  // ── Strategy 1: GBP Media API v4 — LOGO category ONLY ─────────
                  // This is the ACTUAL logo set by the business owner in GBP manager.
                  // We store the googleUrl; the frontend displays it via the OAuth proxy.
                  if (!logoUrl) {
                    const locFullName = loc.name.startsWith("accounts/") ? loc.name : `${accountName}/${loc.name}`;
                    const mediaRes = await fetchWithRetry(
                      `https://mybusiness.googleapis.com/v4/${locFullName}/media`,
                      { headers: { Authorization: `Bearer ${accessToken}` } }
                    );
                    if (mediaRes.ok) {
                      const { mediaItems = [] } = await mediaRes.json();
                      const logoItem = mediaItems.find((m: any) =>
                        (m.locationAssociation?.category || m.category || "").toUpperCase() === "LOGO"
                      );
                      if (logoItem?.googleUrl) {
                        // Mark with gbp: prefix so the proxy knows to attach OAuth token
                        logoUrl = `gbp:${logoItem.googleUrl}`;
                        console.log(`[Sync] ✅ GBP LOGO found for "${loc.title}"`);
                      } else {
                        console.warn(`[Sync] No LOGO category for "${loc.title}" (${mediaItems.length} items)`);
                      }
                    } else {
                      const t = await mediaRes.text();
                      console.warn(`[Sync] GBP Media ${mediaRes.status} for "${loc.title}": ${t.substring(0, 80)}`);
                    }
                  }

                  // ── Strategy 2: Classic Places API (public, uses Maps API key) ─
                  // Photo URLs from this API include the key — no proxy needed.
                  if (!logoUrl && placeId && mapsKey) {
                    const det = await fetch(
                      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=photos&key=${mapsKey}`
                    ).then(r => r.ok ? r.json() : null);
                    const ref = det?.result?.photos?.[0]?.photo_reference;
                    if (ref) {
                      // This URL is publicly accessible — no proxy needed
                      logoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${ref}&key=${mapsKey}`;
                      console.log(`[Sync] ✅ Classic Places logo for "${loc.title}"`);
                    }
                  }

                  if (!logoUrl) console.warn(`[Sync] ❌ No logo for "${loc.title}"`);
                } catch (e) {
                  console.error(`Logo error for ${loc.title}:`, e);
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
              break;
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
