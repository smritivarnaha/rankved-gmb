import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

/**
 * GET /api/reviews/scheduled
 * Query params: profileId ("all" | locationId)
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const profileId = searchParams.get("profileId") || "all";
  const userId = (session as any).user?.id;
  const role = (session as any).user?.role;
  const ownerId = (session as any).user?.ownerId;
  const targetUserId = ownerId || userId;

  try {
    const whereClause: any = {
      status: "SCHEDULED",
      ...(role !== "SUPER_ADMIN" && {
        location: { client: { userId: targetUserId } },
      }),
    };

    if (profileId !== "all") {
      whereClause.locationId = profileId;
    }

    const scheduled = await prisma.scheduledReviewReply.findMany({
      where: whereClause,
      include: {
        location: {
          select: { id: true, name: true, logoUrl: true },
        },
      },
      orderBy: { scheduledFor: "asc" },
    });

    return NextResponse.json({ data: scheduled });
  } catch (err: any) {
    console.error("[Scheduled Reviews] Error:", err);
    return NextResponse.json({ error: err.message || "Failed to load scheduled replies." }, { status: 500 });
  }
}
