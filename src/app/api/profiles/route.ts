import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getAllProfiles, saveProfiles, addProfile, deleteProfile, ProfileData } from "@/lib/profile-store";
import crypto from "crypto";

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

  const profiles = getAllProfiles();
  return NextResponse.json({ data: profiles });
}

// POST /api/profiles — fetch from Google API and save
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const accessToken = (session as any)?.accessToken;
  if (!accessToken) {
    return NextResponse.json({ error: "Google account not connected. Please connect your Google account in Settings first." }, { status: 400 });
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

    // Keep manually-added profiles
    const existing = getAllProfiles();
    const manualProfiles = existing.filter((p) => p.manual);

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

    // Merge: fetched profiles + keep manual ones
    const allProfiles = [...fetchedProfiles, ...manualProfiles];

    if (allProfiles.length === 0) {
      return NextResponse.json({ error: "No profiles could be fetched and no manual profiles exist." }, { status: 404 });
    }

    saveProfiles(allProfiles);

    return NextResponse.json({ data: allProfiles, message: `${fetchedProfiles.length} profiles fetched from Google, ${manualProfiles.length} manual profiles kept.` });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch profiles from Google" }, { status: 500 });
  }
}

// PUT /api/profiles — manually add a profile
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { name, accountName, address, phone, website } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Profile name is required." }, { status: 400 });
    }

    const profile: ProfileData = {
      id: crypto.randomUUID(),
      name: name.trim(),
      accountId: `manual-${Date.now()}`,
      accountName: (accountName || "Manual Entry").trim(),
      address: (address || "").trim(),
      phone: (phone || "").trim(),
      website: (website || "").trim(),
      googleName: "",
      fetchedAt: new Date().toISOString(),
      manual: true,
    };

    addProfile(profile);

    return NextResponse.json({ data: profile, message: `Profile "${profile.name}" added successfully.` });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to add profile" }, { status: 500 });
  }
}

// DELETE /api/profiles — delete a profile by id
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Profile ID is required." }, { status: 400 });
  }

  const deleted = deleteProfile(id);

  if (!deleted) {
    return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  }

  return NextResponse.json({ message: "Profile deleted." });
}
