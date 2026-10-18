import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getValidGoogleAccounts, getEmailFromIdToken, buildGoogleLocationPath } from "@/lib/google-accounts";
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

    // Helper to map a DB LocationReview record to the frontend Google Review format
    const mapDbReviewToApi = (r: any, loc: any) => {
      const hasReply = !!(r.ownerReply && r.ownerReply.trim());
      return {
        name: r.reviewName,
        reviewId: r.reviewId || r.reviewName.split("/").pop(),
        reviewer: {
          displayName: r.reviewerName || "Customer",
          profilePhotoUrl: r.reviewerPhotoUrl || null,
        },
        starRating: r.starRating || (["ONE", "TWO", "THREE", "FOUR", "FIVE"][(r.rating || 5) - 1] ?? "FIVE"),
        rating: r.rating || 5,
        comment: r.comment || "",
        createTime: r.reviewCreateTime ? r.reviewCreateTime.toISOString() : r.createdAt.toISOString(),
        updateTime: r.reviewUpdateTime ? r.reviewUpdateTime.toISOString() : r.updatedAt.toISOString(),
        reviewReply: hasReply
          ? {
              comment: r.ownerReply,
              updateTime: r.ownerReplyTime ? r.ownerReplyTime.toISOString() : r.updatedAt.toISOString(),
            }
          : undefined,
        profileId: loc.id,
        profileName: loc.name,
        profileAddress: loc.address || "",
        profileLogo: loc.logoUrl || null,
        isReplied: hasReply,
      };
    };

    // Helper to fetch reviews for a single location with full pagination (Live Google API)
    const fetchReviewsForLocation = async (loc: any) => {
      const tokens = getTokensForLocation(loc);
      if (tokens.length === 0) return { profile: loc, reviews: [], error: "No access token" };

      const locationPath = buildGoogleLocationPath(loc.gbpAccountId || loc.accountId, loc.gbpLocationId || loc.googleName);
      if (!locationPath) return { profile: loc, reviews: [], error: "Invalid location path" };

      let lastError: string | null = null;

      // Try tokens in sequence until one succeeds
      for (const token of tokens) {
        try {
          let pageToken = "";
          const rawReviews: any[] = [];
          let pageCount = 0;
          const maxPages = 10; // Up to 500 reviews per location

          while (pageCount < maxPages) {
            const reviewsUrl = `https://mybusiness.googleapis.com/v4/${locationPath}/reviews?pageSize=50${pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ""}`;
            const res = await fetchWithRetry(reviewsUrl, {
              headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
              const data = await res.json();
              const pageReviews = data.reviews || [];
              rawReviews.push(...pageReviews);

              if (!data.nextPageToken || pageReviews.length === 0) {
                break;
              }
              pageToken = data.nextPageToken;
              pageCount++;
            } else {
              const errText = await res.text();
              lastError = `Google API ${res.status}: ${errText.substring(0, 120)}`;
              break;
            }
          }

          if (rawReviews.length > 0 || lastError === null) {
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

            // Auto-backup reviews to database vault (batched) and queue auto-replies in background
            import("@/lib/review-backup-service")
              .then(({ syncAndBackupLocationReviews }) =>
                syncAndBackupLocationReviews(loc.id, mappedReviews, undefined, undefined, { isFullSync: false })
              )
              .catch(backupErr => console.error("[Review Backup] Sync error for location:", loc.name, backupErr));

            import("@/lib/auto-reply-service")
              .then(({ queueAutoRepliesForLocation }) =>
                queueAutoRepliesForLocation(loc.id, mappedReviews)
              )
              .catch(autoErr => console.error("[Auto-Reply] Live sync queue error for location:", loc.name, autoErr));

            return { profile: loc, reviews: mappedReviews, error: null };
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

      let allProfileReviews: any[] = [];
      let syncError: string | null = null;

      if (!forceRefresh) {
        const dbReviews = await prisma.locationReview.findMany({
          where: { locationId: profileId, status: "ACTIVE" },
          orderBy: { reviewCreateTime: "desc" },
        });
        if (dbReviews.length > 0) {
          allProfileReviews = dbReviews.map(r => mapDbReviewToApi(r, location));
        }
      }

      if (forceRefresh || allProfileReviews.length === 0) {
        const result = await fetchReviewsForLocation(location);
        allProfileReviews = result.reviews;
        syncError = result.error;
      }

      const pendingCount = allProfileReviews.filter((r: any) => !r.isReplied).length;
      const deletedCount = await prisma.locationReview.count({
        where: { locationId: profileId, status: "DELETED_BY_GOOGLE" },
      });

      const filteredReviews = pendingOnly
        ? allProfileReviews.filter((r: any) => !r.isReplied)
        : allProfileReviews;

      return NextResponse.json({
        data: filteredReviews,
        allReviews: allProfileReviews,
        pendingCount,
        totalCount: allProfileReviews.length,
        deletedCount,
        profilePendingCounts: { [location.id]: pendingCount },
        lastSynced: new Date().toISOString(),
        error: syncError,
      });
    }

    // Case 2: Fetch all profiles
    const allProfiles = (await getAllProfiles(userId, role, ownerId)).filter(p => !p.isHidden);

    if (allProfiles.length === 0) {
      return NextResponse.json({
        data: [],
        allReviews: [],
        profiles: [],
        pendingCount: 0,
        totalCount: 0,
        deletedCount: 0,
        profilePendingCounts: {},
        lastSynced: new Date().toISOString(),
      });
    }

    const profileIds = allProfiles.map(p => p.id);
    const profileById = new Map(allProfiles.map(p => [p.id, p]));

    // Fast path: when forceRefresh is false, load backed-up reviews from Postgres in 1 query (<50ms)!
    const [dbReviewsAll, totalDeletedCount] = await Promise.all([
      !forceRefresh
        ? prisma.locationReview.findMany({
            where: { locationId: { in: profileIds }, status: "ACTIVE" },
            orderBy: { reviewCreateTime: "desc" },
          })
        : Promise.resolve([]),
      prisma.locationReview.count({
        where: {
          status: "DELETED_BY_GOOGLE",
          locationId: { in: profileIds },
        },
      }),
    ]);

    const dbReviewsByLoc = new Map<string, any[]>();
    if (!forceRefresh) {
      for (const r of dbReviewsAll) {
        const loc = profileById.get(r.locationId);
        if (!loc) continue;
        let arr = dbReviewsByLoc.get(r.locationId);
        if (!arr) {
          arr = [];
          dbReviewsByLoc.set(r.locationId, arr);
        }
        arr.push(mapDbReviewToApi(r, loc));
      }
    }

    // Only call live Google API for profiles when forceRefresh=true OR when the profile has 0 reviews in DB
    const profilesNeedingLiveFetch = forceRefresh
      ? allProfiles
      : allProfiles.filter(p => !dbReviewsByLoc.has(p.id));

    const liveResultsByLoc = new Map<string, { reviews: any[]; error: string | null }>();
    if (profilesNeedingLiveFetch.length > 0) {
      const results = await Promise.allSettled(
        profilesNeedingLiveFetch.map(p => fetchReviewsForLocation(p))
      );
      results.forEach((res, idx) => {
        const p = profilesNeedingLiveFetch[idx];
        if (res.status === "fulfilled" && res.value) {
          liveResultsByLoc.set(p.id, { reviews: res.value.reviews, error: res.value.error });
        } else {
          liveResultsByLoc.set(p.id, { reviews: [], error: "Failed to sync" });
        }
      });
    }

    let combinedReviews: any[] = [];
    const profilePendingCounts: Record<string, number> = {};
    let totalPendingCount = 0;
    let totalAllCount = 0;
    const errors: string[] = [];
    const profileSummaries: any[] = [];

    for (const profile of allProfiles) {
      const cached = dbReviewsByLoc.get(profile.id);
      const live = liveResultsByLoc.get(profile.id);
      const reviews = cached ?? live?.reviews ?? [];
      if (live?.error) errors.push(`${profile.name}: ${live.error}`);

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
    }

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
      deletedCount: totalDeletedCount,
      profilePendingCounts,
      errors: errors.length > 0 ? errors : undefined,
      lastSynced: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("[Reviews API] Error:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch reviews" }, { status: 500 });
  }
}
