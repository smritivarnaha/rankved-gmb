import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const monthParam = searchParams.get("month"); // Format: YYYY-MM
    const showHidden = searchParams.get("showHidden") === "true";

    if (!monthParam) {
      return NextResponse.json({ error: "Missing month parameter" }, { status: 400 });
    }

    const [year, month] = monthParam.split("-").map(Number);
    if (!year || !month || month < 1 || month > 12) {
      return NextResponse.json({ error: "Invalid month parameter" }, { status: 400 });
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1); // Start of next month

    const user = (session as any).user;
    const isSuperAdmin = user?.role === "SUPER_ADMIN";
    const targetUserId = user?.ownerId || user?.id;
    const client = await prisma.client.findFirst({ where: { userId: targetUserId } });

    const locationWhere: any = isSuperAdmin ? {} : client ? { clientId: client.id } : { id: "none" };
    if (!showHidden) {
      locationWhere.isHidden = false;
    }

    // Fetch locations
    const locations = await prisma.location.findMany({
      where: locationWhere,
      select: {
        id: true,
        name: true,
        isHidden: true,
      },
      orderBy: { name: "asc" },
    });

    if (locations.length === 0) {
      return NextResponse.json({ locations: [], posts: [] });
    }

    const locationIds = locations.map((l) => l.id);

    // Fetch posts for these locations within the month
    // We check scheduledAt for SCHEDULED, and publishedAt (or scheduledAt fallback) for PUBLISHED
    // DRAFTS could have a scheduledAt, or just not show up if they don't.
    const posts = await prisma.post.findMany({
      where: {
        locationId: { in: locationIds },
        OR: [
          {
            scheduledAt: {
              gte: startDate,
              lt: endDate,
            },
          },
          {
            publishedAt: {
              gte: startDate,
              lt: endDate,
            },
          },
        ],
      },
      select: {
        id: true,
        locationId: true,
        status: true,
        scheduledAt: true,
        publishedAt: true,
        summary: true,
      },
    });

    return NextResponse.json({ locations, posts });
  } catch (error: any) {
    console.error("Timeline API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
