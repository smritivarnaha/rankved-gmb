import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { v4 as uuidv4 } from "uuid";

// GET /api/smm/approvals — list approval groups or fetch a single group by token
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");
    const clientId = searchParams.get("clientId");

    // Public access for client approval page if token is provided
    if (token) {
      const group = await prisma.smmApprovalGroup.findUnique({
        where: { secureToken: token },
        include: {
          client: { select: { id: true, name: true, businessClinicName: true, logo: true } },
          posts: {
            include: {
              destinations: {
                include: {
                  socialAccount: { select: { platform: true, accountName: true, avatarUrl: true } }
                }
              },
              history: { orderBy: { createdAt: "desc" } }
            }
          }
        }
      });

      if (!group) {
        return NextResponse.json({ error: "Approval group not found or link expired" }, { status: 404 });
      }

      return NextResponse.json({ data: group });
    }

    // Authenticated access for listing groups
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!clientId) {
      return NextResponse.json({ error: "Client ID is required" }, { status: 400 });
    }

    // Verify access
    const userRole = session.user.role;
    const isSuperAdmin = userRole === "SUPER_ADMIN";
    const isAgencyOwner = userRole === "AGENCY_OWNER";

    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        OR: isSuperAdmin ? undefined : [
          { userId: session.user.id },
          { smmAssignedUsers: { some: { id: session.user.id } } }
        ]
      }
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found or access denied" }, { status: 404 });
    }

    const groups = await prisma.smmApprovalGroup.findMany({
      where: { clientId },
      include: {
        _count: { select: { posts: true } }
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ data: groups });
  } catch (error: any) {
    console.error("GET SMM Approvals Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

// POST /api/smm/approvals — create an approval group batch
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { clientId, title, postIds } = body;

    if (!clientId || !title || !postIds || postIds.length === 0) {
      return NextResponse.json({ error: "Missing required fields: clientId, title, and postIds are required" }, { status: 400 });
    }

    // Verify access
    const userRole = session.user.role;
    const isSuperAdmin = userRole === "SUPER_ADMIN";
    const isAgencyOwner = userRole === "AGENCY_OWNER";

    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        OR: isSuperAdmin ? undefined : [
          { userId: session.user.id },
          { smmAssignedUsers: { some: { id: session.user.id } } }
        ]
      }
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found or access denied" }, { status: 404 });
    }

    // Generate secure token (XYZ123 style but long enough to be secure)
    const secureToken = uuidv4().replace(/-/g, "").slice(0, 12);

    const group = await prisma.smmApprovalGroup.create({
      data: {
        clientId,
        title,
        secureToken,
        status: "PENDING"
      }
    });

    // Update posts to link them to the group and set status to PENDING_APPROVAL
    await prisma.smmPost.updateMany({
      where: {
        id: { in: postIds },
        clientId
      },
      data: {
        approvalGroupId: group.id,
        status: "PENDING_APPROVAL"
      }
    });

    // Add history entry for each post
    const historyPromises = postIds.map((postId: string) => {
      return prisma.smmApprovalHistory.create({
        data: {
          postId,
          action: "SEND_APPROVAL",
          actor: session.user.name || session.user.email || "Unknown User",
          comments: `Added to approval batch: "${title}"`
        }
      });
    });
    await Promise.all(historyPromises);

    return NextResponse.json({ data: group }, { status: 201 });
  } catch (error: any) {
    console.error("POST SMM Approvals Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

// PUT /api/smm/approvals — client submits feedback (Approve / Reject / Change Request)
// Publicly accessible without authentication
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { token, postId, action, comments, actorName } = body; // action: APPROVE, REJECT, REQUEST_CHANGES

    if (!token || !action) {
      return NextResponse.json({ error: "Token and Action are required" }, { status: 400 });
    }

    const group = await prisma.smmApprovalGroup.findUnique({
      where: { secureToken: token },
      include: { posts: true }
    });

    if (!group) {
      return NextResponse.json({ error: "Approval group not found" }, { status: 404 });
    }

    const actor = actorName || "Client";

    if (postId) {
      // Individual post action
      const post = group.posts.find(p => p.id === postId);
      if (!post) {
        return NextResponse.json({ error: "Post not found in this group" }, { status: 404 });
      }

      const finalStatus = action === "APPROVE" 
        ? (post.scheduledAt ? "SCHEDULED" : "APPROVED") 
        : "REJECTED";

      await prisma.smmPost.update({
        where: { id: postId },
        data: { status: finalStatus }
      });

      await prisma.smmApprovalHistory.create({
        data: {
          postId,
          action: action,
          actor: actor,
          comments: comments || (action === "APPROVE" ? "Approved by client" : "Changes requested by client")
        }
      });
    } else {
      // Group actions (Approve All or Reject All)
      for (const post of group.posts) {
        const finalStatus = action === "APPROVE" 
          ? (post.scheduledAt ? "SCHEDULED" : "APPROVED") 
          : "REJECTED";

        await prisma.smmPost.update({
          where: { id: post.id },
          data: { status: finalStatus }
        });

        await prisma.smmApprovalHistory.create({
          data: {
            postId: post.id,
            action: action,
            actor: actor,
            comments: comments || (action === "APPROVE" ? "Approved all in batch" : "Rejected all in batch")
          }
        });
      }

      await prisma.smmApprovalGroup.update({
        where: { id: group.id },
        data: { status: action === "APPROVE" ? "APPROVED" : "REJECTED" }
      });
    }

    return NextResponse.json({ message: "Approval state updated successfully" });
  } catch (error: any) {
    console.error("PUT SMM Approvals Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
