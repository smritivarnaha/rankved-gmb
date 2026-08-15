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
  const loc = (locationId || "").trim();
  const acc = (accountId || "").trim();

  if (!loc && !acc) return "";

  // Case 1: locationId is already full resource path (e.g. accounts/123/locations/456)
  if (loc.includes("accounts/") && loc.includes("locations/")) {
    return loc;
  }

  // Case 2: locationId has locations/456 and accountId has accounts/123
  const cleanAcc = acc ? (acc.startsWith("accounts/") ? acc : `accounts/${acc}`) : "";
  const cleanLoc = loc ? (loc.startsWith("locations/") ? loc : `locations/${loc}`) : "";

  if (cleanAcc && cleanLoc) return `${cleanAcc}/${cleanLoc}`;
  return cleanLoc || cleanAcc;
}

/**
 * GET /api/reviews
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const profileId = searchParams.get("profileId") || "all";
  const forceRefresh = searchParams.get("forceRefresh") === "true";
  const pendingOnly = searchParams.get("pendingOnly") === "true";

  const userId = (session as any).user?.id;
  const role = (session as any).user?.role;
  const ownerId = (session as any).user?.ownerId;
  const sessionAccessToken = (session as any)?.accessToken;

  try {
    const prisma = (await import("@/lib/prisma")).default;

    // Collect all possible Google OAuth accounts for this user/team
    const targetUserId = ownerId || userId;
    let accounts: any[] = [];
    
    try {
      accounts = await getValidGoogleAccounts(targetUserId, forceRefresh);
      if (accounts.length === 0 && ownerId) {
        accounts = await getValidGoogleAccounts(userId, forceRefresh);
      }
      if (accounts.length === 0) {
        accounts = await prisma.account.findMany({ where: { provider: "google" } });
      }
    } catch (e) {
      console.warn("[Reviews] Error getting DB google accounts:", e);
    }

    // Add session token if not already in pool
    if (sessionAccessToken && !accounts.some(a => a.access_token === sessionAccessToken)) {
      accounts.unshift({ access_token: sessionAccessToken, provider: "google" });
    }

    if (accounts.length === 0) {
      return NextResponse.json({
        error: "No connected Google accounts found. Please reconnect your Google account in Settings.",
        data: [],
        profiles: [],
        pendingCount: 0,
        totalCount: 0,
        profilePendingCounts: {},
      }, { status: 200 });
    }

    // Helper: find the best token for a location
    const getTokensForLocation = (location: any): string[] => {
      const tokens: string[] = [];
      if (location.googleEmail) {
        const match = accounts.find(a => {
          const email = getEmailFromIdToken(a.id_token);
          return email?.toLowerCase() === location.googleEmail?.toLowerCase();
        });
        if (match?.access_token) tokens.push(match.access_token);
      }
      // Add other accounts as fallbacks
      accounts.forEach(a => {
        if (a.access_token && !tokens.includes(a.access_token)) {
          tokens.push(a.access_token);
        }
      });
      if (sessionAccessToken && !tokens.includes(sessionAccessToken)) {
        tokens.push(sessionAccessToken);
      }
      return tokens;
    };

    // Helper to fetch reviews for a single location
    const fetchReviewsForLocation = async (loc: any) => {
      const tokens = getTokensForLocation(loc);
      if (tokens.length === 0) return { profile: loc, reviews: [], error: "No access token" };

      const locationPath = buildGoogleLocationPath(loc.gbpAccountId || loc.accountId, loc.gbpLocationId || loc.googleName);
      if (!locationPath) return { profile: loc, reviews: [], error: "Invalid location path" };

      let lastError: string | null = null;

      // Try tokens in sequence until one succeeds
      for (const token of tokens) {
        try {
          const reviewsUrl = `https://mybusiness.googleapis.com/v4/${locationPath}/reviews?pageSize=50`;
          const res = await fetchWithRetry(reviewsUrl, {
            headers: { Authorization: `Bearer ${token}` }
          });

          if (res.ok) {
            const data = await res.json();
            const rawReviews = data.reviews || [];

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
          } else {
            const errText = await res.text();
            lastError = `Google API ${res.status}: ${errText.substring(0, 120)}`;
          }
        } catch (e: any) {
          lastError = e.message;
        }
      }

      return { profile: loc, reviews: [], error: lastError };
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

    const results = await Promise.allSettled(
      allProfiles.map(p => fetchReviewsForLocation(p))
    );

    let combinedReviews: any[] = [];
    const profilePendingCounts: Record<string, number> = {};
    let totalPendingCount = 0;
    let totalAllCount = 0;
    const errors: string[] = [];

    const profileSummaries: any[] = [];

    results.forEach((res, idx) => {
      const profile = allProfiles[idx];
      if (res.status === "fulfilled" && res.value) {
        const { reviews, error } = res.value;
        if (error) errors.push(`${profile.name}: ${error}`);

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
      errors: errors.length > 0 ? errors : undefined,
      lastSynced: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("[Reviews API] Error:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch reviews" }, { status: 500 });
  }
}
