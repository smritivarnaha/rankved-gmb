import { Worker, Job } from "bullmq";
import { PrismaClient } from "@prisma/client";
import { connection, POSTS_QUEUE_NAME } from "./connection";
import { GBPApiService } from "@/services/gbp-api";
import { postsQueue } from "./post-queue";
import { notifyAdmin } from "@/lib/notifications";

// We instantiate a new Prisma client instance for the worker to use
// independent of the Next.js API processes
const prisma = new PrismaClient();

function decryptToken(encryptedToken: string): string {
  const cryptoModule = require("crypto");
  const ENCRYPTION_KEY = process.env.TOKEN_ENCRYPTION_KEY || "0000000000000000000000000000000000000000000000000000000000000000";
  const parts = encryptedToken.split(":");
  const iv = Buffer.from(parts[0], "hex");
  const authTag = Buffer.from(parts[1], "hex");
  const encryptedData = Buffer.from(parts[2], "hex");
  
  const decipher = cryptoModule.createDecipheriv("aes-256-gcm", Buffer.from(ENCRYPTION_KEY, "hex"), iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encryptedData, undefined, "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

export const postWorker = new Worker(
  POSTS_QUEUE_NAME,
  async (job: Job) => {
    if (job.name === "check-scheduled-posts") {
      return await handleScheduleCheck();
    } else if (job.name === "watchkeeper-check") {
      return await handleWatchkeeperCheck();
    } else if (job.name === "publish-post") {
      return await handlePublishPost(job.data.postId);
    }
  },
  { connection, concurrency: 5 }
);

postWorker.on("completed", (job) => {
  console.log(`Job ${job.id} of type ${job.name} completed successfully.`);
});

postWorker.on("failed", (job, err) => {
  console.error(`Job ${job?.id} failed:`, err.message);
});

async function handleScheduleCheck() {
  const now = new Date();
  
  // Find all posts that are SCHEDULED and their schedule date has passed
  const duePosts = await prisma.post.findMany({
    where: {
      status: "SCHEDULED",
      scheduledAt: { lte: now },
    },
  });

  if (duePosts.length === 0) {
    return "No posts due.";
  }

  console.log(`Found ${duePosts.length} posts due for publishing.`);

  // Create a separate job for each post so they process independently and can fail/retry individually
  for (const post of duePosts) {
    await postsQueue.add("publish-post", { postId: post.id });
    
    // Mark as publishing immediately to prevent double queuing
    await prisma.post.update({
      where: { id: post.id },
      data: { status: "PUBLISHING" },
    });
  }

  return `Queued ${duePosts.length} posts via BullMQ.`;
}

async function handlePublishPost(postId: string) {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: {
      location: true,
      user: {
        include: {
          accounts: {
            where: { provider: "google" }
          }
        }
      }
    }
  });

  if (!post || !post.user?.accounts?.[0]?.access_token) {
    throw new Error(`Post ${postId} not found or missing Google integration.`);
  }

  try {
    const decryptedAccessToken = decryptToken(post.user.accounts[0].access_token);

    // 2. Initialize GBP Service
    const gbpApi = new GBPApiService(decryptedAccessToken);

    // 3. Publish to Google
    const response = await gbpApi.createPost(post.location.gbpAccountId, post.location.gbpLocationId, post);

    // 4. Record Success
    const gbpPostId = response.name; // ID returned by google API
    
    await prisma.post.update({
      where: { id: postId },
      data: {
        status: "PUBLISHED",
        publishedAt: new Date(),
        gbpPostId,
        errorMessage: null,
      },
    });

    console.log(`Successfully published post ${postId} (Google ID: ${gbpPostId})`);
    return response;

  } catch (error: any) {
    // 5. Handle Failure
    console.error(`Failed to publish post ${postId}:`, error);

    const errorMessage = error.body ? JSON.stringify(error.body) : error.message;

    // Increment retry count
    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: {
        retryCount: { increment: 1 },
        errorMessage,
      },
    });

    if (updatedPost.retryCount >= updatedPost.maxRetries) {
      await prisma.post.update({
        where: { id: postId },
        data: { status: "FAILED" },
      });
      console.log(`Post ${postId} failed permanently after ${updatedPost.maxRetries} retries.`);
    } else {
      // Re-throw so BullMQ will trigger exponential backoff based on the job configuration
      // Status remains "PUBLISHING" until either success or MAX retries hit FAILED status
      throw error;
    }
  }
}

async function handleWatchkeeperCheck() {
  const now = new Date();
  const pastBuffer = new Date(now.getTime() - 60 * 60 * 1000); // 1 hour ago
  
  // Find posts that should have been published by now but are still SCHEDULED/PUBLISHING
  const stuckPosts = await prisma.post.findMany({
    where: {
      status: { in: ["SCHEDULED", "PUBLISHING"] },
      scheduledAt: { lte: pastBuffer },
    },
    include: { location: true, user: { include: { accounts: { where: { provider: "google" } } } } }
  });

  // Find posts recently PUBLISHED (last 3 days) to check if they got REJECTED by Google
  const recentPublished = await prisma.post.findMany({
    where: {
      status: "PUBLISHED",
      publishedAt: { gte: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000) },
      gbpPostId: { not: null }
    },
    include: { location: true, user: { include: { accounts: { where: { provider: "google" } } } } }
  });

  const allCheckPosts = [...stuckPosts, ...recentPublished];
  if (allCheckPosts.length === 0) return "No posts to check.";

  // Group by location to minimize API calls
  const locationsMap = new Map();
  for (const post of allCheckPosts) {
    if (!locationsMap.has(post.locationId)) {
      locationsMap.set(post.locationId, {
        location: post.location,
        user: post.user,
        posts: []
      });
    }
    locationsMap.get(post.locationId).posts.push(post);
  }

  const failures = [];

  for (const [locationId, data] of Array.from(locationsMap.entries())) {
    const { location, user, posts } = data;
    const tokenPayload = user?.accounts?.[0]?.access_token;
    if (!tokenPayload) continue;

    try {
      const decryptedAccessToken = decryptToken(tokenPayload);
      const gbpApi = new GBPApiService(decryptedAccessToken);
      const livePosts = await gbpApi.listLocalPosts(location.gbpAccountId, location.gbpLocationId);
      
      for (const post of posts) {
        // If it was SCHEDULED/PUBLISHING and it's missing from live posts, it failed
        // If it was PUBLISHED and we find it but its state is REJECTED, it failed
        const liveMatch = livePosts.find((lp: any) => lp.name === post.gbpPostId || (lp.summary && lp.summary === post.summary));

        let hasFailed = false;
        let failReason = "";

        if (post.status === "PUBLISHED") {
          if (liveMatch && liveMatch.state === "REJECTED") {
            hasFailed = true;
            failReason = "Rejected by Google";
          }
        } else {
          // It was SCHEDULED or PUBLISHING, so it should be live by now
          if (!liveMatch) {
            hasFailed = true;
            failReason = "Failed to publish (missing from live feed)";
          } else if (liveMatch.state === "REJECTED") {
            hasFailed = true;
            failReason = "Rejected by Google";
          } else {
            // It actually succeeded but DB didn't update
            await prisma.post.update({
              where: { id: post.id },
              data: { status: "PUBLISHED", publishedAt: new Date(), gbpPostId: liveMatch.name }
            });
            console.log(`Watchkeeper fixed stuck post ${post.id} -> PUBLISHED`);
          }
        }

        if (hasFailed) {
          await prisma.post.update({
            where: { id: post.id },
            data: { status: "FAILED", failureReason: failReason }
          });
          failures.push({ post, location, reason: failReason });
        }
      }
    } catch (error) {
      console.error(`Watchkeeper failed checking location ${locationId}:`, error);
    }
  }

  if (failures.length > 0) {
    const lines = failures.map(f => `- [${f.location.name}] ${f.post.summary.substring(0, 30)}... (${f.reason})`).join("\n");
    await notifyAdmin({
      subject: `⚠️ Watchkeeper Alert: ${failures.length} stuck or rejected posts found`,
      text: `The daily watchkeeper caught ${failures.length} posts that failed to publish or were rejected by Google.\n\n${lines}`,
    });
  }

  return `Watchkeeper check complete. Found ${failures.length} failures out of ${allCheckPosts.length} posts checked.`;
}
