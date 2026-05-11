import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  return NextResponse.json({
    database: {
      usedMB: "12.50",
      totalMB: 500,
      percent: "2.5"
    },
    images: {
      usedMB: "150.00",
      totalMB: 1000,
      count: 75,
      percent: "15.0"
    },
    posts: {
      total: 75
    }
  });
}
