import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session as any).user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden: Super Admin only" }, { status: 403 });
  }

  try {
    const { userId, isApproved } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isApproved },
    });

    return NextResponse.json({
      success: true,
      data: { id: updatedUser.id, isApproved: updatedUser.isApproved },
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update approval status" }, { status: 500 });
  }
}
