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
  if (!(session as any).user.isApproved) {
    return NextResponse.json({ error: "Your account is pending approval." }, { status: 403 });
  }

  const userId = (session as any).user.id;
  const role = (session as any).user.role;

  const profiles = await getAllProfiles(userId, role);
  return NextResponse.json({ data: profiles });
}

// POST /api/profiles — fetch from Google API and save
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(session as any).user.isApproved) {
    return NextResponse.json({ error: "Your account is pending approval by rankved.business@gmail.com." }, { status: 403 });
  }

  const accessToken = (session as any)?.accessToken;
  if (!accessToken) {
    return NextResponse.json({ error: "Google account not connected. Please connect your Google account in Settings first." }, { status: 400 });
  }

  const userId = (session as any)?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Could not determine user ID from session." }, { status: 401 });
  }

  try {
    // Step 1: Get all GBP accounts (with retry)
    const accountsRes = await fetchWithRetry("https://mybusinessaccountmanagement.googleapis.com/v1/accounts", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!accountsRes.ok) {
      const err = await accountsRes.json().catch(() => ({}));
      const msg = err?.error?.message || `Google API error (${accountsRes.status})`;
      return NextResponse.json({ error: msg }, { status: accountsRes.status });
    }

    const accountsData = await accountsRes.json();
    const accounts = accountsData.accounts || [];

    if (accounts.length === 0) {
      return NextResponse.json({ error: "No Google Business Profile accounts found for this Google account." }, { status: 404 });
    }

    // Step 2: For each account, get locations (with delay between each to avoid rate limits)
    const fetchedProfiles: ProfileData[] = [];

    for (let i = 0; i < accounts.length; i++) {
      const account = accounts[i];
      const accountName = account.name;
      const accountDisplayName = account.accountName || account.name;

      if (i > 0) await delay(1500);

      try {
        const locationsRes = await fetchWithRetry(
          `https://mybusinessbusinessinformation.googleapis.com/v1/${accountName}/locations?readMask=name,title,storefrontAddress,phoneNumbers,websiteUri`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        if (locationsRes.ok) {
          const locData = await locationsRes.json();
          const locations = locData.locations || [];

          for (const loc of locations) {
            const addressParts = loc.storefrontAddress || {};
            const addressLines = [
              ...(addressParts.addressLines || []),
              addressParts.locality || "",
              addressParts.administrativeArea || "",
              addressParts.postalCode || "",
            ].filter(Boolean);

            fetchedProfiles.push({
              id: crypto.randomUUID(),
              name: loc.title || loc.name || "Unnamed Location",
              accountId: accountName,
              accountName: accountDisplayName,
              address: addressLines.join(", "),
              phone: loc.phoneNumbers?.primaryPhone || "",
              website: loc.websiteUri || "",
              googleName: loc.name || "",
              fetchedAt: new Date().toISOString(),
            });
          }
        }
      } catch {
        console.warn(`Error fetching locations for ${accountName}, skipping...`);
      }
    }

    if (fetchedProfiles.length === 0) {
      return NextResponse.json({ error: "No profiles found on this Google account." }, { status: 404 });
    }

    await saveProfiles(fetchedProfiles, userId);

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
  if (role !== "ADMIN") {
    return NextResponse.json({ error: "Only admins can delete profiles" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Profile ID required" }, { status: 400 });

  const success = await deleteProfile(id);
  if (!success) return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}
