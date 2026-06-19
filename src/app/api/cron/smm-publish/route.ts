import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { publishToSocialPlatform } from "@/lib/smm-publisher";

export const maxDuration = 60; // Max execution timeout limit (60s)

export async function GET(req: NextRequest) {
  // Optional security check (Vercel Cron Secret validation)
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  try {
    // Find all posts that are SCHEDULED and due to publish
    const duePosts = await prisma.smmPost.findMany({
      where: {
        status: "SCHEDULED",
        scheduledAt: { lte: now }
      },
      include: {
        destinations: {
          where: { status: "PENDING" },
          include: {
            socialAccount: true
          }
        }
      }
    });

    if (duePosts.length === 0) {
      return NextResponse.json({ message: "No due SMM posts found.", processed: 0 });
    }

    console.log(`[SMM CRON] Found ${duePosts.length} due SMM posts to publish`);
    const results: any[] = [];

    for (const post of duePosts) {
      // Optimistic lock: update status to PUBLISHING to prevent concurrent cron workers
      try {
        await prisma.smmPost.update({
          where: { id: post.id, status: "SCHEDULED" },
          data: { status: "PUBLISHING" }
        });
      } catch (e) {
        console.log(`[SMM CRON] Skipping SMM post ${post.id} - currently being processed by another worker.`);
        continue;
      }

      let allSuccess = true;
      const destResults = [];

      for (const dest of post.destinations) {
        const account = dest.socialAccount;
        
        try {
          const result = await publishToSocialPlatform(
            { caption: post.caption, hashtags: post.hashtags, mediaUrls: post.mediaUrls },
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
            destResults.push({ platform: account.platform, success: true });
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
            destResults.push({ platform: account.platform, success: false, error: result.errorMessage });
          }
        } catch (e: any) {
          allSuccess = false;
          await prisma.smmPostDestination.update({
            where: { id: dest.id },
            data: {
              status: "FAILED",
              errorMessage: e.message || "Unknown publishing error"
            }
          });
          destResults.push({ platform: account.platform, success: false, error: e.message });
        }
      }

      const finalStatus = allSuccess ? "PUBLISHED" : "FAILED";
      await prisma.smmPost.update({
        where: { id: post.id },
        data: {
          status: finalStatus,
          publishedAt: allSuccess ? new Date() : null
        }
      });

      // Write publishing engine logs to history
      await prisma.smmApprovalHistory.create({
        data: {
          postId: post.id,
          action: allSuccess ? "PUBLISH_SUCCESS" : "PUBLISH_FAILED",
          actor: "Background Cron Publisher",
          comments: allSuccess 
            ? "Published automatically at scheduled time to all platforms." 
            : `Auto-publish failed. Platform results: ${JSON.stringify(destResults)}`
        }
      });

      results.push({ postId: post.id, status: finalStatus, destinations: destResults });
    }

    return NextResponse.json({ message: "SMM Cron processing complete", processed: results.length, data: results });
  } catch (error: any) {
    console.error("[SMM CRON ERROR]:", error);
    return NextResponse.json({ error: error.message || "Cron internal server error" }, { status: 500 });
  }
}
