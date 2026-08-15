import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

/**
 * DELETE /api/reviews/scheduled/[id]
 * Cancels a scheduled reply
 */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    await prisma.scheduledReviewReply.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to cancel scheduled reply." }, { status: 500 });
  }
}

/**
 * PUT /api/reviews/scheduled/[id]
 * Updates reply comment or scheduled date
 */
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const { replyComment, scheduledFor } = await req.json();

    const updateData: any = {};
    if (replyComment !== undefined) updateData.replyComment = replyComment.trim();
    if (scheduledFor !== undefined) updateData.scheduledFor = new Date(scheduledFor);

    const updated = await prisma.scheduledReviewReply.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update scheduled reply." }, { status: 500 });
  }
}
