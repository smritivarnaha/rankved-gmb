/**
 * /api/cron/publish — Publishes all due SCHEDULED posts to GBP
 *
 * Called by Vercel Cron every minute.
 * Protected by CRON_SECRET env variable.
 */

import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { publishToGBP } from "@/lib/gbp-publisher";
import { getGoogleAccessTokenForLocation } from "@/lib/google-token";
import { notifyAdmin, templates, getTemplate } from "@/lib/notifications";

// Allow the Vercel Serverless Function to run for the maximum 60 seconds (Hobby Tier)
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  // Self-heal: Reset stuck "PUBLISHING" posts older than 10 minutes
  // If a server restarted or timed out during execution, this prevents posts from getting stuck forever.
  try {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const stuckPosts = await prisma.post.findMany({
      where: {
        status: "PUBLISHING",
        updatedAt: { lte: tenMinutesAgo }
      }
    });

    if (stuckPosts.length > 0) {
      console.log(`[CRON] Found ${stuckPosts.length} stuck PUBLISHING posts. Resetting them to FAILED.`);
      await prisma.post.updateMany({
        where: {
          id: { in: stuckPosts.map(p => p.id) }
        },
        data: {
          status: "FAILED",
          failureReason: "Publishing timed out during execution (automatic recovery)."
        }
      });
    }
  } catch (err: any) {
    console.error("[CRON] Self-healing failed:", err.message);
  }

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
    // Attempt to lock the post by updating its status from SCHEDULED to PUBLISHING.
    // This atomic operation prevents concurrent cron runs from processing the same post.
    try {
      await prisma.post.update({
        where: { id: dbPost.id, status: "SCHEDULED" },
        data: { status: "PUBLISHING" },
      });
    } catch (e) {
      console.log(`[CRON] Skipping post ${dbPost.id} - already being processed by another worker.`);
      continue;
    }

    // Use our new global helper to find the most appropriate access token
    // This takes care of looking up the admin/owner account and refreshing if needed
    const accessToken = await getGoogleAccessTokenForLocation(dbPost.locationId);

    if (!accessToken) {
      await prisma.post.update({
        where: { id: dbPost.id },
        data: {
          status: "FAILED",
          failureReason: "User's Google access token not found or expired. They need to reconnect their Google account.",
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
      const template = await getTemplate("SUCCESS", post);
      await notifyAdmin(template);
    } else {
      results.push({ id: dbPost.id, status: "FAILED", error: result.error });
      await prisma.post.update({
        where: { id: dbPost.id },
        data: {
          status: "FAILED",
          failureReason: result.error || "GBP publish failed",
        },
      });
      const template = await getTemplate("FAILURE", { ...post, error: result.error });
      await notifyAdmin(template);
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

  // --- Auto-update sitemaps (once every 25 hours per profile) ---
  try {
    const twentyFiveHoursAgo = new Date(Date.now() - 25 * 60 * 60 * 1000);
    const locationsToUpdate = await prisma.location.findMany({
      where: {
        OR: [
          { sitemapUpdatedAt: null },
          { sitemapUpdatedAt: { lte: twentyFiveHoursAgo } }
        ],
        AND: {
          OR: [
            { website: { not: null, notIn: [""] } },
            { aiWebsite: { not: null, notIn: [""] } }
          ]
        }
      },
      take: 5 // Limit to 5 updates per run to keep execution fast and prevent timeouts
    });

    if (locationsToUpdate.length > 0) {
      console.log(`[CRON] Found ${locationsToUpdate.length} locations needing sitemap updates. Auto-updating now...`);
      const { autoFetchLocationSitemap } = await import("@/lib/sitemap-helper");
      for (const loc of locationsToUpdate) {
        const res = await autoFetchLocationSitemap(loc.id);
        console.log(`[CRON] Sitemap auto-update for location "${loc.name}" (${loc.id}): ${res.success ? "SUCCESS" : "FAILED"} (${res.count} URLs)`);
      }
    }
  } catch (sitemapErr) {
    console.error("[CRON] Sitemap auto-update failed", sitemapErr);
  }

  // Send summary notification to admin
  if (results.length > 0) {
    await notifyAdmin(templates.cronSummary(results.length, results));
  }

  return NextResponse.json({ processed: results.length, results });
}
