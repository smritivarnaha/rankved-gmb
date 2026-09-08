import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { generateSmartReviewReply } from "@/lib/ai-review-reply";

/**
 * POST /api/reviews/generate-reply
 * Body: { profileId, reviewText, reviewerName, rating, preferredTone }
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { profileId, reviewText, reviewerName, rating, preferredTone } = body;

    if (!profileId) {
      return NextResponse.json({ error: "Profile ID is required" }, { status: 400 });
    }

    const userId = (session as any).user?.id;

    const result = await generateSmartReviewReply({
      locationId: profileId,
      reviewText,
      reviewerName,
      rating: rating ? parseInt(rating, 10) : 5,
      preferredTone: preferredTone || "WARM",
      userId,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (err: any) {
    console.error("[Generate Reply API] Error:", err);
    return NextResponse.json({ error: err.message || "Failed to generate review reply" }, { status: 500 });
  }
}
