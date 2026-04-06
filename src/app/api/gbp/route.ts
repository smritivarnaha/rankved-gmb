import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

// Helper: delay to avoid rate limits
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Helper: fetch with exponential backoff retry on 429
async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 3): Promise<Response> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch(url, options);

    if (response.status === 429 && attempt < maxRetries) {
      // Rate limited — wait and retry
      const retryAfter = response.headers.get("Retry-After");
      const waitMs = retryAfter ? parseInt(retryAfter) * 1000 : 2000 * Math.pow(2, attempt);
      console.log(`Rate limited, retrying in ${waitMs}ms (attempt ${attempt + 1}/${maxRetries})`);
      await delay(waitMs);
      continue;
    }

    return response;
  }

  // Should never reach here, but just in case
  return fetch(url, options);
}

/**
 * Fetches all Google Business accounts and their locations
 * using the access token stored in the user's session.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const accessToken = (session as any)?.accessToken;

    if (!accessToken) {
      return NextResponse.json(
        { error: "Not connected to Google. Please sign in first." },
        { status: 401 }
      );
    }

    // Step 1: Fetch all GBP accounts
    const accountsRes = await fetchWithRetry(
      "https://mybusinessaccountmanagement.googleapis.com/v1/accounts",
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!accountsRes.ok) {
      const err = await accountsRes.json().catch(() => ({}));
      console.error("Google API error:", accountsRes.status, JSON.stringify(err, null, 2));
      return NextResponse.json(
        { error: "Failed to fetch GBP accounts", details: err, googleStatus: accountsRes.status },
        { status: 200 } // Return 200 so frontend can read the full error
      );
    }

    const accountsData = await accountsRes.json();
    const accounts = accountsData.accounts || [];

    // Step 2: For each account, fetch locations WITH a delay between each
    const results = [];

    for (let i = 0; i < accounts.length; i++) {
      const account = accounts[i];
      const accountName = account.name; // e.g. "accounts/12345"

      // Add a 1.5-second delay between account location fetches to avoid rate limits
      if (i > 0) {
        await delay(1500);
      }

      const locsRes = await fetchWithRetry(
        `https://mybusinessbusinessinformation.googleapis.com/v1/${accountName}/locations?readMask=name,title,storefrontAddress,phoneNumbers`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      let locations: any[] = [];
      if (locsRes.ok) {
        const locsData = await locsRes.json();
        locations = (locsData.locations || []).map((loc: any) => ({
          id: loc.name,
          name: loc.title || "Unnamed Location",
          address: loc.storefrontAddress
            ? [
                loc.storefrontAddress.addressLines?.[0],
                loc.storefrontAddress.locality,
                loc.storefrontAddress.administrativeArea,
                loc.storefrontAddress.postalCode,
              ]
                .filter(Boolean)
                .join(", ")
            : null,
          phone: loc.phoneNumbers?.primaryPhone || null,
        }));
      } else {
        console.warn(`Failed to fetch locations for ${accountName}:`, locsRes.status);
      }

      results.push({
        accountId: accountName,
        accountName: account.accountName || account.name,
        type: account.type,
        locations,
      });
    }

    return NextResponse.json({ data: results });
  } catch (error: any) {
    console.error("GBP fetch error:", error);
    return NextResponse.json(
      { error: error.message || "Internal error" },
      { status: 500 }
    );
  }
}
