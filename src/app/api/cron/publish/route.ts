/**
 * /api/cron/publish — Publishes all due SCHEDULED posts to GBP
 *
 * Called by Vercel Cron every minute.
 * Protected by CRON_SECRET env variable.
 */

import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { publishToGBP } from "@/lib/gbp-publisher";

export async function GET(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  // Find all posts that are scheduled and due
  const duePosts = await prisma.post.findMany({
    where: {
      status: "SCHEDULED",
      scheduledAt: { lte: now },
    },
    include: {
      location: { include: { client: true } },
      user: true,
    },
  });

  if (duePosts.length === 0) {
    return NextResponse.json({ message: "No due posts", processed: 0 });
  }

  console.log(`[CRON] Found ${duePosts.length} due posts to publish`);

  const results: { id: string; status: string; error?: string }[] = [];

  for (const dbPost of duePosts) {
    // Get the access token for the post's owner
    const userAccount = await prisma.account.findFirst({
      where: { userId: dbPost.userId, provider: "google" },
    });

    if (!userAccount?.access_token) {
      await prisma.post.update({
        where: { id: dbPost.id },
        data: {
          status: "FAILED",
          failureReason: "User's Google access token not found. They need to reconnect.",
        },
      });
      results.push({ id: dbPost.id, status: "FAILED", error: "No access token" });
      continue;
    }

    const post = {
      id: dbPost.id,
      profileId: dbPost.locationId,
      profileName: dbPost.location?.name || "",
      clientName: dbPost.location?.client?.name || "",
      summary: dbPost.summary,
      topicType: dbPost.topicType || "STANDARD",
      ctaType: dbPost.ctaType || "",
      ctaUrl: dbPost.ctaUrl || "",
      finalUrl: dbPost.ctaUrl || "",
      imageUrl: dbPost.mediaUrl || null,
      geoLat: "",
      geoLng: "",
      eventTitle: dbPost.eventTitle || "",
      eventStart: dbPost.eventStartDate?.toISOString() || "",
      eventEnd: dbPost.eventEndDate?.toISOString() || "",
      status: "SCHEDULED" as const,
      scheduledAt: dbPost.scheduledAt?.toISOString() || null,
      publishedAt: null,
      createdBy: dbPost.user?.email || "",
      createdAt: dbPost.createdAt.toISOString(),
      updatedAt: dbPost.updatedAt.toISOString(),
    };

    const result = await publishToGBP({
      post,
      accessToken: userAccount.access_token,
      imageDataUri: dbPost.mediaUrl || null,
    });

    if (result.success) {
      await prisma.post.update({
        where: { id: dbPost.id },
        data: {
          status: "PUBLISHED",
          publishedAt: new Date(),
          gbpPostName: result.gbpPostName || null,
        },
      });
      results.push({ id: dbPost.id, status: "PUBLISHED" });
    } else {
      await prisma.post.update({
        where: { id: dbPost.id },
        data: {
          status: "FAILED",
          failureReason: result.error || "Unknown error",
        },
      });
      results.push({ id: dbPost.id, status: "FAILED", error: result.error });
    }

    // Brief delay between posts to avoid GBP rate limits
    await new Promise(r => setTimeout(r, 500));
  }

  return NextResponse.json({ processed: results.length, results });
}
