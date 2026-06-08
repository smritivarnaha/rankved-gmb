import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { notifyAdmin } from "@/lib/notifications";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    // 1. Find posts that are SCHEDULED but missed their time by more than 1 hour.
    // This gives the regular publisher cron job enough time to process them.
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    const missedPosts = await prisma.post.findMany({
      where: {
        status: "SCHEDULED",
        scheduledAt: {
          lt: oneHourAgo,
        },
      },
      include: { location: true },
    });

    // 2. Find posts that recently FAILED (in the last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const failedPosts = await prisma.post.findMany({
      where: {
        status: "FAILED",
        updatedAt: {
          gte: oneDayAgo,
        },
      },
      include: { location: true },
    });

    if (missedPosts.length === 0 && failedPosts.length === 0) {
      return NextResponse.json({ message: "All good. No missed or failed posts." });
    }

    // Prepare email content
    let emailText = `The GBP Scheduler Watchkeeper has found some issues with your posts:\n\n`;

    if (missedPosts.length > 0) {
      emailText += `--- MISSED SCHEDULES (${missedPosts.length}) ---\n`;
      emailText += `These posts passed their scheduled time but were never published. They might be stuck.\n\n`;
      for (const p of missedPosts) {
        emailText += `Location: ${p.location?.name || "Unknown"}\n`;
        emailText += `Scheduled For: ${p.scheduledAt?.toLocaleString()}\n`;
        emailText += `Summary: ${p.summary.substring(0, 50)}...\n\n`;
      }
    }

    if (failedPosts.length > 0) {
      emailText += `--- FAILED OR REJECTED POSTS (${failedPosts.length}) ---\n`;
      emailText += `These posts attempted to publish in the last 24 hours but failed (e.g., rejected by Google).\n\n`;
      for (const p of failedPosts) {
        emailText += `Location: ${p.location?.name || "Unknown"}\n`;
        emailText += `Error Reason: ${p.failureReason || p.errorMessage || "Unknown Error"}\n`;
        emailText += `Summary: ${p.summary.substring(0, 50)}...\n\n`;
      }
    }

    emailText += `\nPlease log in to your dashboard to review and fix these posts.`;

    await notifyAdmin({
      subject: `🚨 Watchkeeper Alert: ${missedPosts.length + failedPosts.length} Post Issues Detected`,
      text: emailText,
    });

    return NextResponse.json({
      message: "Issues detected. Email sent to admin.",
      missedCount: missedPosts.length,
      failedCount: failedPosts.length,
    });
  } catch (error: any) {
    console.error("[Watchkeeper] Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
