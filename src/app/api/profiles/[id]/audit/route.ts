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

    // --- CALCULATIONS ---

    // A. Profile Completion Score & Checklist
    const checklist = {
      businessName: !!location.title,
      address: !!location.storefrontAddress,
      phone: !!location.phoneNumbers?.primaryPhone,
      website: !!location.websiteUri,
      hours: !!location.regularHours,
      description: !!location.profile?.description,
      category: !!location.categories?.primaryCategory
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
    // Combines Profile Quality (50%), Reply Rate (30%), and Review Velocity (20% maxed at 2 reviews/week)
    const velocityScore = Math.min(reviewsPerWeek / 2, 1) * 20;
    const visibilityScore = Math.min(100, Math.round((completionScore * 0.5) + (replyRate * 0.3) + velocityScore));

    return NextResponse.json({
      data: {
        completionScore,
        checklist,
        replyRate,
        reviewsPerWeek,
        visibilityScore,
        totalReviews: location.metadata?.userReviewCount || reviews.length,
        averageRating: location.metadata?.averageRating || 0,
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
