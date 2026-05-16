import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getValidGoogleAccounts } from "@/lib/google-accounts";

async function fetchWithRetry(url: string, options: RequestInit, retries = 2): Promise<Response> {
  for (let i = 0; i <= retries; i++) {
    const res = await fetch(url, options);
    if (res.status === 429 && i < retries) {
      await new Promise(r => setTimeout(r, 1500 * (i + 1)));
      continue;
    }
    return res;
  }
  return fetch(url, options);
}

/**
 * GET /api/reviews?profileId=xxx
 * Fetches Google Business Profile reviews for a given location.
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const profileId = searchParams.get("profileId");
  if (!profileId) return NextResponse.json({ error: "profileId is required" }, { status: 400 });

  const userId = (session as any).user.id;

  try {
    // Get the location from DB
    const prisma = (await import("@/lib/prisma")).default;
    const location = await prisma.location.findUnique({ where: { id: profileId } });
    if (!location) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

    // Get valid Google access token
    const accounts = await getValidGoogleAccounts(userId);

    // Match token to this location's Google account if possible (fall back to first)
    const accessToken = accounts[0]?.access_token;
    if (!accessToken) {
      return NextResponse.json({ error: "No valid Google account connected" }, { status: 400 });
    }

    // v4 reviews API needs full path: accounts/{acct}/locations/{loc}
    // gbpAccountId = "accounts/xxx", gbpLocationId = "locations/yyy"
    const locationPath = `${location.gbpAccountId}/${location.gbpLocationId}`;
    const reviewsUrl = `https://mybusiness.googleapis.com/v4/${locationPath}/reviews?pageSize=50`;
    console.log("[Reviews] Fetching:", reviewsUrl);

    const reviewsRes = await fetchWithRetry(
      reviewsUrl,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!reviewsRes.ok) {
      const err = await reviewsRes.text();
      console.error("[Reviews] Fetch failed:", reviewsRes.status, err.substring(0, 300));
      // Return a descriptive error so the UI can display it
      const parsed = (() => { try { return JSON.parse(err); } catch { return null; } })();
      const msg = parsed?.error?.message || `Google API returned ${reviewsRes.status}`;
      return NextResponse.json({ error: msg }, { status: 502 });
    }

    const data = await reviewsRes.json();
    const reviews = data.reviews || [];

    return NextResponse.json({
      data: reviews,
      totalReviewCount: data.totalReviewCount ?? reviews.length,
      averageRating: data.averageRating ?? null,
    });
  } catch (err: any) {
    console.error("[Reviews] Error:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch reviews" }, { status: 500 });
  }
}
