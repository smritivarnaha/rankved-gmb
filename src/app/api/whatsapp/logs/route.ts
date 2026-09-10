import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const locationId = searchParams.get("locationId");
    const direction = searchParams.get("direction");
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    const whereClause: any = {};
    if (locationId) whereClause.locationId = locationId;
    if (direction) whereClause.direction = direction;

    const logs = await prisma.whatsAppMessageLog.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        location: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: logs });
  } catch (error: any) {
    console.error("GET /api/whatsapp/logs error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch logs" }, { status: 500 });
  }
}
