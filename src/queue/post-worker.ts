import { Worker, Job } from "bullmq";
import { PrismaClient } from "@prisma/client";
import { connection, POSTS_QUEUE_NAME } from "./connection";
import { GBPApiService } from "@/services/gbp-api";
import { postsQueue } from "./post-queue";

// We instantiate a new Prisma client instance for the worker to use
// independent of the Next.js API processes
const prisma = new PrismaClient();

export const postWorker = new Worker(
  POSTS_QUEUE_NAME,
  async (job: Job) => {
    if (job.name === "check-scheduled-posts") {
      return await handleScheduleCheck();
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
    // 1. Decrypt token dynamically
    // Use dynamic import because we rely on Next/Server crypto libs
    // which work inside Node env but we must provide process.env
    const cryptoModule = require("crypto");
    
    // Simplified inline decrypt logic for the standalone worker
    const ENCRYPTION_KEY = process.env.TOKEN_ENCRYPTION_KEY || "0000000000000000000000000000000000000000000000000000000000000000";
    
    const tokenPayload = post.user.accounts[0].access_token;
    const parts = tokenPayload.split(":");
    const iv = Buffer.from(parts[0], "hex");
    const authTag = Buffer.from(parts[1], "hex");
    const encryptedData = Buffer.from(parts[2], "hex");
    
    const decipher = cryptoModule.createDecipheriv("aes-256-gcm", Buffer.from(ENCRYPTION_KEY, "hex"), iv);
    decipher.setAuthTag(authTag);
    let decryptedAccessToken = decipher.update(encryptedData, undefined, "utf8");
    decryptedAccessToken += decipher.final("utf8");

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
