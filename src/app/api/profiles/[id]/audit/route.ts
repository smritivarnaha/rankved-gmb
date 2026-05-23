import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getProfileById } from "@/lib/profile-store";
import { getValidGoogleAccounts, getEmailFromIdToken } from "@/lib/google-accounts";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session as any).user.id;
  const role = (session as any).user.role;

  const profile = await getProfileById(id, userId, role);
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  const validAccounts = await getValidGoogleAccounts(userId);
  if (validAccounts.length === 0) return NextResponse.json({ error: "No valid Google accounts connected." }, { status: 400 });

  let accessToken: string | null = null;
  if (profile.googleEmail) {
    const matchedAccount = validAccounts.find(acc => getEmailFromIdToken(acc.id_token) === profile.googleEmail);
    if (matchedAccount) accessToken = matchedAccount.access_token;
  }
  if (!accessToken) accessToken = validAccounts[0].access_token;
  if (!accessToken) return NextResponse.json({ error: "No valid access token available." }, { status: 400 });

  const resourceName = profile.googleName;
  const accountName = profile.accountId;

  try {
    // 1. Fetch Full Location Details for Completion Score
    const locUrl = `https://mybusinessbusinessinformation.googleapis.com/v1/${resourceName}?readMask=name,title,storefrontAddress,phoneNumbers,websiteUri,regularHours,specialHours,serviceArea,labels,adWordsLocationExtensions,latlng,openInfo,metadata,profile,categories`;
    const locRes = await fetch(locUrl, { headers: { Authorization: `Bearer ${accessToken}` } });
    const location = await locRes.json();

    // 2. Fetch Reviews for Review Scores
    const reviewsUrl = `https://mybusiness.googleapis.com/v4/${accountName}/${resourceName}/reviews?pageSize=50`;
    const reviewsRes = await fetch(reviewsUrl, { headers: { Authorization: `Bearer ${accessToken}` } });
    const reviewsData = await reviewsRes.json();
    const reviews = reviewsData.reviews || [];

    // 3. Fetch Media Items (Photos Count)
    let photoCount = 0;
    try {
      const mediaUrl = `https://mybusiness.googleapis.com/v4/${accountName}/${resourceName}/media?pageSize=100`;
      const mediaRes = await fetch(mediaUrl, { headers: { Authorization: `Bearer ${accessToken}` } });
      if (mediaRes.ok) {
        const mediaData = await mediaRes.json();
        photoCount = (mediaData.mediaItems || []).length;
      }
    } catch (e) {
      console.error("Error fetching media for audit:", e);
    }

    // 4. Fetch Local Posts (Posting Frequency Audit)
    let recentPostCount = 0;
    let lastPostDaysAgo: number | null = null;
    try {
      const postsUrl = `https://mybusiness.googleapis.com/v4/${accountName}/${resourceName}/localPosts?pageSize=10`;
      const postsRes = await fetch(postsUrl, { headers: { Authorization: `Bearer ${accessToken}` } });
      if (postsRes.ok) {
        const postsData = await postsRes.json();
        const posts = postsData.localPosts || [];
        if (posts.length > 0) {
          const now = new Date();
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          
          const recentPosts = posts.filter((p: any) => new Date(p.createTime || p.updateTime) > thirtyDaysAgo);
          recentPostCount = recentPosts.length;
          
          const lastPostTime = new Date(posts[0].createTime || posts[0].updateTime);
          const diffTime = Math.abs(now.getTime() - lastPostTime.getTime());
          lastPostDaysAgo = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        }
      }
    } catch (e) {
      console.error("Error fetching posts for audit:", e);
    }

    // --- CALCULATIONS ---

    // A. Profile Completion Score & Checklist
    const checklist = {
      businessName: !!location.title,
      address: !!location.storefrontAddress,
      phone: !!location.phoneNumbers?.primaryPhone,
      website: !!location.websiteUri,
      hours: !!location.regularHours,
      description: !!location.profile?.description,
      category: !!location.categories?.primaryCategory,
      additionalCategories: !!location.categories?.additionalCategories?.length,
      specialHours: !!location.specialHours?.specialHours?.length,
      serviceArea: !!location.serviceArea?.places?.length || !!location.serviceArea?.regionCodes?.length,
      photos: photoCount >= 10,
      googlePosts: recentPostCount > 0
    };

    const fieldsToTrack = Object.values(checklist);
    const filledFields = fieldsToTrack.filter(Boolean).length;
    const completionScore = Math.round((filledFields / fieldsToTrack.length) * 100);

    // B. Review Reply Score
    const repliedCount = reviews.filter((r: any) => r.reviewReply).length;
    const replyRate = reviews.length > 0 ? Math.round((repliedCount / reviews.length) * 100) : 0;

    // C. Review Velocity (Last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentReviews = reviews.filter((r: any) => new Date(r.createTime) > thirtyDaysAgo);
    const reviewsPerWeek = parseFloat((recentReviews.length / 4).toFixed(1));

    // D. Custom Visibility Score (0-100)
    // Combines Profile Quality (40%), Reply Rate (25%), Review Velocity (15%), Photo Count (10%), and Posts Recency (10%)
    const velocityScore = Math.min(reviewsPerWeek / 2, 1) * 15; // Max 15 points
    const photoScore = Math.min(photoCount / 10, 1) * 10;       // Max 10 points
    
    let postScore = 0;
    if (lastPostDaysAgo !== null) {
      if (lastPostDaysAgo <= 14) postScore = 10;
      else if (lastPostDaysAgo <= 30) postScore = 5;
    }
    
    const visibilityScore = Math.min(100, Math.round(
      (completionScore * 0.4) + 
      (replyRate * 0.25) + 
      velocityScore + 
      photoScore + 
      postScore
    ));

    return NextResponse.json({
      data: {
        completionScore,
        checklist,
        replyRate,
        reviewsPerWeek,
        visibilityScore,
        totalReviews: location.metadata?.userReviewCount || reviews.length,
        averageRating: location.metadata?.averageRating || 0,
        photoCount,
        recentPostCount,
        lastPostDaysAgo,
        reviewsList: reviews.slice(0, 5) // Send 5 recent reviews for audit UI feed!
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
