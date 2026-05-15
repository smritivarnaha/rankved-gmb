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
    
    // Try to find the account matching this location's email
    let accessToken = accounts[0]?.access_token;
    if (!accessToken) {
      return NextResponse.json({ error: "No valid Google account connected" }, { status: 400 });
    }

    // GBP v4 API: accounts/{accountId}/locations/{locationId}/reviews
    const locationName = `${location.gbpAccountId}/${location.gbpLocationId}`;
    const reviewsRes = await fetchWithRetry(
      `https://mybusiness.googleapis.com/v4/${locationName}/reviews?pageSize=50`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!reviewsRes.ok) {
      const err = await reviewsRes.text();
      console.error("[Reviews] Fetch failed:", reviewsRes.status, err.substring(0, 200));
      return NextResponse.json({ error: `Google API error: ${reviewsRes.status}` }, { status: 502 });
    }

    const data = await reviewsRes.json();
    const reviews = data.reviews || [];

    // Also try to get aggregate rating
    return NextResponse.json({
      data: reviews,
      totalReviewCount: data.totalReviewCount || reviews.length,
      averageRating: data.averageRating || null,
    });
  } catch (err: any) {
    console.error("[Reviews] Error:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch reviews" }, { status: 500 });
  }
}
