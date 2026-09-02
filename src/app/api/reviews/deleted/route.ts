import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { generateGoogleAppealEvidence } from "@/lib/review-backup-service";

/**
 * GET /api/reviews/deleted
 * Query params: profileId ("all" | locationId)
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const profileId = searchParams.get("profileId") || "all";

  try {
    const whereClause: any = {
      status: "DELETED_BY_GOOGLE",
    };

    if (profileId !== "all") {
      whereClause.locationId = profileId;
    }

    const [deletedReviews, incidents] = await Promise.all([
      prisma.locationReview.findMany({
        where: whereClause,
        include: {
          location: {
            select: { id: true, name: true, logoUrl: true, address: true },
          },
        },
        orderBy: { deletedAt: "desc" },
      }),
      prisma.reviewDropIncident.findMany({
        where: profileId !== "all" ? { locationId: profileId } : {},
        include: {
          location: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    ]);

    // Attach pre-formatted appeal evidence to each review
    const enrichedReviews = deletedReviews.map(r => ({
      ...r,
      appealEvidence: generateGoogleAppealEvidence(r, r.location?.name),
    }));

    return NextResponse.json({
      data: enrichedReviews,
      totalDeleted: enrichedReviews.length,
      incidents,
    });
  } catch (err: any) {
    console.error("[Deleted Reviews API] Error:", err);
    return NextResponse.json({ error: err.message || "Failed to load deleted reviews." }, { status: 500 });
  }
}
