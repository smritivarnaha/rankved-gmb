import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { publishToSocialPlatform } from "@/lib/smm-publisher";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get("clientId");
    const status = searchParams.get("status");
    const startDateStr = searchParams.get("startDate");
    const endDateStr = searchParams.get("endDate");

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

    const where: any = { clientId };

    if (status) {
      where.status = status;
    }

    if (startDateStr && endDateStr) {
      where.scheduledAt = {
        gte: new Date(startDateStr),
        lte: new Date(endDateStr)
      };
    }

    const posts = await prisma.smmPost.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
        destinations: {
          include: {
            socialAccount: { select: { id: true, platform: true, accountName: true, avatarUrl: true } }
          }
        },
        history: { orderBy: { createdAt: "desc" } }
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ data: posts });
  } catch (error: any) {
    console.error("GET SMM Posts Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { clientId, caption, hashtags, internalNotes, mediaUrls, platforms, status, scheduledAt } = body;

    if (!clientId || !caption || !platforms || platforms.length === 0) {
      return NextResponse.json({ error: "Missing required fields: clientId, caption, and at least one platform are required" }, { status: 400 });
    }

    // Verify client access
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        OR: session.user.role === "SUPER_ADMIN" ? undefined : [
          { userId: session.user.id },
          { smmAssignedUsers: { some: { id: session.user.id } } }
        ]
      }
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found or access denied" }, { status: 404 });
    }

    // Resolve which social accounts to target
    const targetAccounts = await prisma.socialAccount.findMany({
      where: {
        clientId,
        platform: { in: platforms }
      }
    });

    if (targetAccounts.length === 0) {
      return NextResponse.json({ error: "No connected social accounts found for selected platforms. Please connect them first." }, { status: 400 });
    }

    const postStatus = status === "PUBLISHED" ? "PUBLISHING" : (status || "DRAFT");

    // 1. Create SmmPost
    const post = await prisma.smmPost.create({
      data: {
        clientId,
        userId: session.user.id,
        caption,
        hashtags,
        internalNotes,
        mediaUrls: mediaUrls || [],
        status: postStatus,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      }
    });

    // 2. Create SmmPostDestinations
    const destinationPromises = targetAccounts.map(account => {
      return prisma.smmPostDestination.create({
        data: {
          postId: post.id,
          socialAccountId: account.id,
          status: "PENDING"
        }
      });
    });
    const destinations = await Promise.all(destinationPromises);

    // Create Initial History entry
    await prisma.smmApprovalHistory.create({
      data: {
        postId: post.id,
        action: "CREATE",
        actor: session.user.name || session.user.email || "Unknown User",
        comments: `Created post with status: ${status}`
      }
    });

    // 3. If Publish Now (PUBLISHED status)
    if (status === "PUBLISHED") {
      let allSuccess = true;
      const results = [];

      for (const account of targetAccounts) {
        const dest = destinations.find(d => d.socialAccountId === account.id);
        if (!dest) continue;

        try {
          const result = await publishToSocialPlatform(
            { caption, hashtags, mediaUrls: mediaUrls || [] },
            account
          );

          if (result.success) {
            await prisma.smmPostDestination.update({
              where: { id: dest.id },
              data: {
                status: "PUBLISHED",
                publishedAt: new Date(),
                externalPostId: result.externalPostId,
                apiResponse: result.apiResponse
              }
            });
            results.push({ platform: account.platform, success: true });
          } else {
            allSuccess = false;
            await prisma.smmPostDestination.update({
              where: { id: dest.id },
              data: {
                status: "FAILED",
                errorMessage: result.errorMessage,
                apiResponse: result.apiResponse
              }
            });
            results.push({ platform: account.platform, success: false, error: result.errorMessage });
          }
        } catch (e: any) {
          allSuccess = false;
          await prisma.smmPostDestination.update({
            where: { id: dest.id },
            data: {
              status: "FAILED",
              errorMessage: e.message || "Unknown error during publish"
            }
          });
          results.push({ platform: account.platform, success: false, error: e.message });
        }
      }

      const finalStatus = allSuccess ? "PUBLISHED" : "FAILED";
      const updatedPost = await prisma.smmPost.update({
        where: { id: post.id },
        data: {
          status: finalStatus,
          publishedAt: allSuccess ? new Date() : null
        },
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

      // Add history entry for publishing result
      await prisma.smmApprovalHistory.create({
        data: {
          postId: post.id,
          action: allSuccess ? "PUBLISH_SUCCESS" : "PUBLISH_FAILED",
          actor: "System Publisher",
          comments: allSuccess 
            ? "Published successfully to all selected channels" 
            : `Failed to publish. Results: ${JSON.stringify(results)}`
        }
      });

      return NextResponse.json({ data: updatedPost });
    }

    // Return the saved post
    const fullPost = await prisma.smmPost.findUnique({
      where: { id: post.id },
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

    return NextResponse.json({ data: fullPost }, { status: 201 });
  } catch (error: any) {
    console.error("POST SMM Post Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
