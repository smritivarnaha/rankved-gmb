import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { caption, hashtags, internalNotes, mediaUrls, platforms, status, scheduledAt } = body;

    const post = await prisma.smmPost.findUnique({
      where: { id },
      include: { client: true }
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Verify access
    const userRole = session.user.role;
    const isSuperAdmin = userRole === "SUPER_ADMIN";
    const isAgencyOwner = userRole === "AGENCY_OWNER";
    
    if (!isSuperAdmin && !isAgencyOwner && post.client.userId !== session.user.id) {
      const assigned = await prisma.client.findFirst({
        where: {
          id: post.clientId,
          smmAssignedUsers: { some: { id: session.user.id } }
        }
      });
      if (!assigned) {
        return NextResponse.json({ error: "Forbidden: Access denied to client workspace" }, { status: 403 });
      }
    }

    const updateData: any = {};
    if (caption !== undefined) updateData.caption = caption;
    if (hashtags !== undefined) updateData.hashtags = hashtags;
    if (internalNotes !== undefined) updateData.internalNotes = internalNotes;
    if (mediaUrls !== undefined) updateData.mediaUrls = mediaUrls;
    if (status !== undefined) updateData.status = status;
    if (scheduledAt !== undefined) updateData.scheduledAt = scheduledAt ? new Date(scheduledAt) : null;

    // Handle updates to platform destinations if provided
    if (platforms) {
      // Find connected social accounts matching these platform names
      const accounts = await prisma.socialAccount.findMany({
        where: {
          clientId: post.clientId,
          platform: { in: platforms }
        }
      });

      // Simple sync: delete old destinations and recreate
      await prisma.smmPostDestination.deleteMany({
        where: { postId: id }
      });

      const destinationPromises = accounts.map(account => {
        return prisma.smmPostDestination.create({
          data: {
            postId: id,
            socialAccountId: account.id,
            status: "PENDING"
          }
        });
      });
      await Promise.all(destinationPromises);
    }

    const updatedPost = await prisma.smmPost.update({
      where: { id },
      data: updateData,
      include: {
        user: { select: { id: true, name: true, email: true } },
        destinations: {
          include: {
            socialAccount: { select: { id: true, platform: true, accountName: true, avatarUrl: true } }
          }
        },
        history: true
      }
    });

    // Create a history log entry
    await prisma.smmApprovalHistory.create({
      data: {
        postId: id,
        action: "UPDATE",
        actor: session.user.name || session.user.email || "Unknown User",
        comments: `Updated post fields. Status set to: ${status || post.status}`
      }
    });

    return NextResponse.json({ data: updatedPost });
  } catch (error: any) {
    console.error("PUT SMM Post Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const post = await prisma.smmPost.findUnique({
      where: { id },
      include: { client: true }
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Verify access
    const userRole = session.user.role;
    const isSuperAdmin = userRole === "SUPER_ADMIN";
    const isAgencyOwner = userRole === "AGENCY_OWNER";
    
    if (!isSuperAdmin && !isAgencyOwner && post.client.userId !== session.user.id) {
      const assigned = await prisma.client.findFirst({
        where: {
          id: post.clientId,
          smmAssignedUsers: { some: { id: session.user.id } }
        }
      });
      if (!assigned) {
        return NextResponse.json({ error: "Forbidden: Access denied to client workspace" }, { status: 403 });
      }
    }

    await prisma.smmPost.delete({
      where: { id }
    });

    return NextResponse.json({ message: "Post deleted successfully" });
  } catch (error: any) {
    console.error("DELETE SMM Post Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
