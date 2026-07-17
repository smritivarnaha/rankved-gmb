import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = (session.user as any).role;
  const allowedRoles = ["SUPER_ADMIN", "AGENCY_OWNER"];
  if (!allowedRoles.includes(role)) {
    return NextResponse.json({ error: "Unauthorized: Admin access required" }, { status: 403 });
  }

  try {
    const scans = await prisma.rankScan.findMany({
      where: { locationId: id },
      orderBy: { createdAt: "desc" },
      include: {
        points: true
      }
    });

    return NextResponse.json({ data: scans });
  } catch (error: any) {
    console.error("[RankHistoryAPI] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
