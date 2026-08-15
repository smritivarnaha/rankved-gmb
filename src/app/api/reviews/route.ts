import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getValidGoogleAccounts, getEmailFromIdToken } from "@/lib/google-accounts";
import { getAllProfiles } from "@/lib/profile-store";

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

function buildGoogleLocationPath(accountId?: string, locationId?: string): string {
  if (!locationId && !accountId) return "";
  const loc = (locationId || "").trim();
  const acc = (accountId || "").trim();

  // If locationId is already a full path: accounts/123/locations/456
  if (loc.includes("accounts/") && loc.includes("locations/")) {
    return loc;
  }

  const cleanAcc = acc ? (acc.startsWith("accounts/") ? acc : `accounts/${acc}`) : "";
  const cleanLoc = loc ? (loc.startsWith("locations/") ? loc : `locations/${loc}`) : "";

  if (cleanAcc && cleanLoc) return `${cleanAcc}/${cleanLoc}`;
  return cleanLoc || cleanAcc;
}

/**
 * GET /api/reviews
 * Query params:
 * - profileId: "all" | string (optional, defaults to "all")
 * - forceRefresh: "true" | "false" (optional)
 * - status: "pending" | "replied" | "all" (optional, defaults to "all" with client-side filter)
 * - pendingOnly: "true" | "false" (optional)
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const profileId = searchParams.get("profileId") || "all";
  const forceRefresh = searchParams.get("forceRefresh") === "true";
  const pendingOnly = searchParams.get("pendingOnly") === "true";

  const userId = (session as any).user.id;
  const role = (session as any).user.role;
  const ownerId = (session as any).user.ownerId;

  try {
    const prisma = (await import("@/lib/prisma")).default;

    // Resolve Google OAuth accounts
    const targetUserId = ownerId || userId;
    let accounts = await getValidGoogleAccounts(targetUserId, forceRefresh);
    if (accounts.length === 0 && ownerId) {
      accounts = await getValidGoogleAccounts(userId, forceRefresh);
    }
    if (accounts.length === 0) {
      accounts = await prisma.account.findMany({ where: { provider: "google" } });
    }
    if (accounts.length === 0 && (session as any).accessToken) {
      accounts = [{ access_token: (session as any).accessToken } as any];
    }

    if (accounts.length === 0) {
      return NextResponse.json({
        error: "No connected Google accounts found. Please connect your Google account in Settings.",
        data: [],
        profiles: [],
        pendingCount: 0,
        totalCount: 0,
        profilePendingCounts: {},
      }, { status: 200 });
    }

    // Helper: find the best matching accessToken for a location
    const getAccessTokenForLocation = (location: any) => {
      if (location.googleEmail) {
        const match = accounts.find(a => {
          const email = getEmailFromIdToken(a.id_token);
          return email?.toLowerCase() === location.googleEmail?.toLowerCase();
        });
        if (match?.access_token) return match.access_token;
      }
      return accounts[0]?.access_token;
    };

    // Helper to fetch reviews for a single location
    const fetchReviewsForLocation = async (loc: any) => {
      try {
        const token = getAccessTokenForLocation(loc);
        if (!token) return { profile: loc, reviews: [], error: "No access token available" };

        const locationPath = buildGoogleLocationPath(loc.gbpAccountId || loc.accountId, loc.gbpLocationId || loc.googleName);
        if (!locationPath) return { profile: loc, reviews: [], error: "Invalid location path" };

        const reviewsUrl = `https://mybusiness.googleapis.com/v4/${locationPath}/reviews?pageSize=50`;
        console.log(`[Reviews] Fetching for ${loc.name} -> ${reviewsUrl}`);

        const res = await fetchWithRetry(reviewsUrl, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!res.ok) {
          const errText = await res.text();
          console.warn(`[Reviews] Google API ${res.status} for ${loc.name}:`, errText.substring(0, 200));
          return { profile: loc, reviews: [], error: `Google API ${res.status}: ${errText.substring(0, 100)}` };
        }

        const data = await res.json();
        const rawReviews = data.reviews || [];

        // Attach profile metadata to each review
        const mappedReviews = rawReviews.map((r: any) => {
          const hasReply = !!(r.reviewReply && r.reviewReply.comment && r.reviewReply.comment.trim());
          return {
            ...r,
            profileId: loc.id,
            profileName: loc.name,
            profileAddress: loc.address || "",
            profileLogo: loc.logoUrl || null,
            isReplied: hasReply,
          };
        });

        return { profile: loc, reviews: mappedReviews, error: null };
      } catch (e: any) {
        console.error(`[Reviews] Exception fetching for ${loc.name}:`, e);
        return { profile: loc, reviews: [], error: e.message };
      }
    };

    // Case 1: Fetch single profile
    if (profileId !== "all") {
      const location = await prisma.location.findUnique({ where: { id: profileId } });
      if (!location) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

      const result = await fetchReviewsForLocation(location);
      let reviews = result.reviews;
      const pendingCount = result.reviews.filter((r: any) => !r.isReplied).length;

      if (pendingOnly) {
        reviews = reviews.filter((r: any) => !r.isReplied);
      }

      return NextResponse.json({
        data: reviews,
        pendingCount,
        totalCount: result.reviews.length,
        profilePendingCounts: { [location.id]: pendingCount },
        lastSynced: new Date().toISOString(),
        error: result.error,
      });
    }

    // Case 2: Fetch all profiles in parallel
    const allProfiles = (await getAllProfiles(userId, role, ownerId)).filter(p => !p.isHidden);

    if (allProfiles.length === 0) {
      return NextResponse.json({
        data: [],
        profiles: [],
        pendingCount: 0,
        totalCount: 0,
        profilePendingCounts: {},
        lastSynced: new Date().toISOString(),
      });
    }

    // Run parallel fetches across all profiles
    const results = await Promise.allSettled(
      allProfiles.map(p => fetchReviewsForLocation(p))
    );

    let combinedReviews: any[] = [];
    const profilePendingCounts: Record<string, number> = {};
    let totalPendingCount = 0;
    let totalAllCount = 0;

    const profileSummaries: any[] = [];

    results.forEach((res, idx) => {
      const profile = allProfiles[idx];
      if (res.status === "fulfilled" && res.value) {
        const { reviews } = res.value;
        const pendingForThis = reviews.filter((r: any) => !r.isReplied).length;
        profilePendingCounts[profile.id] = pendingForThis;
        totalPendingCount += pendingForThis;
        totalAllCount += reviews.length;

        profileSummaries.push({
          id: profile.id,
          name: profile.name,
          truncatedName: profile.name.length > 9 ? profile.name.slice(0, 8) + "…" : profile.name,
          address: profile.address || "",
          logoUrl: profile.logoUrl || null,
          pendingCount: pendingForThis,
          totalCount: reviews.length,
        });

        combinedReviews.push(...reviews);
      } else {
        profilePendingCounts[profile.id] = 0;
        profileSummaries.push({
          id: profile.id,
          name: profile.name,
          truncatedName: profile.name.length > 9 ? profile.name.slice(0, 8) + "…" : profile.name,
          address: profile.address || "",
          logoUrl: profile.logoUrl || null,
          pendingCount: 0,
          totalCount: 0,
        });
      }
    });

    // Sort all reviews date-wise (newest first)
    combinedReviews.sort((a, b) => {
      const timeA = new Date(a.createTime || 0).getTime();
      const timeB = new Date(b.createTime || 0).getTime();
      return timeB - timeA;
    });

    const unrepliedReviews = combinedReviews.filter(r => !r.isReplied);

    return NextResponse.json({
      data: pendingOnly ? unrepliedReviews : combinedReviews,
      allReviews: combinedReviews,
      profiles: profileSummaries,
      pendingCount: totalPendingCount,
      totalCount: totalAllCount,
      profilePendingCounts,
      lastSynced: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("[Reviews API] Top-level error:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch reviews" }, { status: 500 });
  }
}
