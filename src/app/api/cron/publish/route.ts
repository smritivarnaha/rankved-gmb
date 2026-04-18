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
          failureReason: "User's Google access token not found. They need to reconnect their Google account.",
        },
      });
      results.push({ id: dbPost.id, status: "FAILED", error: "No access token" });
      continue;
    }

    let accessToken = userAccount.access_token;

    // ✅ Refresh the token if it's expired
    const tokenExpiry = userAccount.expires_at ? userAccount.expires_at * 1000 : 0;
    const isExpired = tokenExpiry > 0 && Date.now() > tokenExpiry - 60_000; // 1 min buffer

    if (isExpired && userAccount.refresh_token) {
      console.log(`[CRON] Access token expired for user ${dbPost.userId}, refreshing...`);
      try {
        const refreshRes = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: process.env.GOOGLE_CLIENT_ID || "",
            client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
            grant_type: "refresh_token",
            refresh_token: userAccount.refresh_token,
          }),
        });
        const refreshData = await refreshRes.json();
        if (refreshRes.ok && refreshData.access_token) {
          accessToken = refreshData.access_token;
          const newExpiresAt = Math.floor((Date.now() + refreshData.expires_in * 1000) / 1000);
          // Persist refreshed token back to DB
          await prisma.account.update({
            where: { id: userAccount.id },
            data: {
              access_token: refreshData.access_token,
              expires_at: newExpiresAt,
              ...(refreshData.refresh_token ? { refresh_token: refreshData.refresh_token } : {}),
            },
          });
          console.log(`[CRON] Token refreshed successfully for user ${dbPost.userId}`);
        } else {
          console.error("[CRON] Token refresh failed:", refreshData);
          await prisma.post.update({
            where: { id: dbPost.id },
            data: {
              status: "FAILED",
              failureReason: "Google access token expired and refresh failed. User must reconnect their Google account.",
            },
          });
          results.push({ id: dbPost.id, status: "FAILED", error: "Token refresh failed" });
          continue;
        }
      } catch (refreshErr: any) {
        console.error("[CRON] Token refresh error:", refreshErr);
        await prisma.post.update({
          where: { id: dbPost.id },
          data: { status: "FAILED", failureReason: `Token refresh error: ${refreshErr.message}` },
        });
        results.push({ id: dbPost.id, status: "FAILED", error: "Token refresh error" });
        continue;
      }
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
      accessToken: accessToken,
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

  // --- Auto-cleanup: Delete images from Supabase to save 50MB free quota ---
  // We delete images that have been published for more than 24 hours.
  // Google has already downloaded them, so we no longer need to host them.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (supabaseUrl && supabaseKey) {
    try {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const stalePosts = await prisma.post.findMany({
        where: {
          status: "PUBLISHED",
          publishedAt: { lte: yesterday },
          mediaUrl: { contains: "supabase.co" }
        }
      });
      
      let deletedImages = 0;
      for (const sp of stalePosts) {
        if (!sp.mediaUrl) continue;
        const urlParts = sp.mediaUrl.split("/object/public/");
        if (urlParts.length === 2) {
          const filePath = urlParts[1]; // e.g. "post-images/gbp-posts/1713386000000.jpg"
          // Call Supabase API to delete the object using Service Role key
          const delRes = await fetch(`${supabaseUrl}/storage/v1/object/${filePath}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${supabaseKey}` }
          });
          if (delRes.ok) {
            await prisma.post.update({
              where: { id: sp.id },
              data: { mediaUrl: null }
            });
            deletedImages++;
          }
        }
      }
      console.log(`[CRON] Cleaned up ${deletedImages} stale images from Supabase.`);
    } catch (e) {
      console.error("[CRON] Storage cleanup failed", e);
    }
  }

  return NextResponse.json({ processed: results.length, results });
}
