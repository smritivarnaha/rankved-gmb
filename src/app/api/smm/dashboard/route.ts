import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get("clientId");

    const userId = session.user.id;
    const role = session.user.role;
    const isSuperAdmin = role === "SUPER_ADMIN";
    const isAgencyOwner = role === "AGENCY_OWNER";

    // --- CASE 1: Single Client-scoped Dashboard ---
    if (clientId) {
      // Verify user has access to this client
      const client = await prisma.client.findFirst({
        where: {
          id: clientId,
          OR: isSuperAdmin ? undefined : [
            { userId },
            { smmAssignedUsers: { some: { id: userId } } }
          ]
        }
      });

      if (!client) {
        return NextResponse.json({ error: "Client workspace access denied" }, { status: 403 });
      }

      const [connections, upcomingPosts, pendingApprovals, publishedPosts, history] = await Promise.all([
        prisma.socialAccount.findMany({ where: { clientId } }),
        prisma.smmPost.findMany({
          where: { clientId, status: "SCHEDULED" },
          orderBy: { scheduledAt: "asc" },
          take: 5
        }),
        prisma.smmPost.findMany({
          where: { clientId, status: "PENDING_APPROVAL" },
          orderBy: { createdAt: "desc" },
          take: 5
        }),
        prisma.smmPost.findMany({
          where: { clientId, status: "PUBLISHED" },
          orderBy: { publishedAt: "desc" },
          take: 5
        }),
        prisma.smmApprovalHistory.findMany({
          where: { post: { clientId } },
          orderBy: { createdAt: "desc" },
          take: 10,
          include: {
            post: { select: { caption: true } }
          }
        })
      ]);

      return NextResponse.json({
        data: {
          scope: "CLIENT",
          client,
          connections,
          upcomingPosts,
          pendingApprovals,
          publishedPosts,
          activityTimeline: history.map(h => ({
            id: h.id,
            action: h.action,
            actor: h.actor,
            comments: h.comments,
            postCaption: h.post.caption,
            createdAt: h.createdAt
          }))
        }
      });
    }

    // --- CASE 2: Multi-client Agency Overview ---
    let clientWhere: any = {};
    let postWhere: any = {};
    if (!isSuperAdmin) {
      if (isAgencyOwner) {
        clientWhere = { userId };
        postWhere = { client: { userId } };
      } else {
        // Team member
        clientWhere = { smmAssignedUsers: { some: { id: userId } } };
        postWhere = { client: { smmAssignedUsers: { some: { id: userId } } } };
      }
    }

    const [clientCount, accountCount, scheduledCount, publishedCount, failedCount, pendingCount, upcomingPosts] = await Promise.all([
      prisma.client.count({ where: clientWhere }),
      prisma.socialAccount.count({ where: { client: clientWhere } }),
      prisma.smmPost.count({ where: { ...postWhere, status: "SCHEDULED" } }),
      prisma.smmPost.count({ where: { ...postWhere, status: "PUBLISHED" } }),
      prisma.smmPost.count({ where: { ...postWhere, status: "FAILED" } }),
      prisma.smmPost.count({ where: { ...postWhere, status: "PENDING_APPROVAL" } }),
      prisma.smmPost.findMany({
        where: { ...postWhere, status: "SCHEDULED" },
        orderBy: { scheduledAt: "asc" },
        take: 5,
        include: {
          client: { select: { name: true } }
        }
      })
    ]);

    return NextResponse.json({
      data: {
        scope: "AGENCY",
        stats: {
          totalClients: clientCount,
          connectedAccounts: accountCount,
          scheduledCount,
          publishedCount,
          failedCount,
          pendingCount
        },
        upcomingPosts
      }
    });
  } catch (error: any) {
    console.error("SMM Dashboard API Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
