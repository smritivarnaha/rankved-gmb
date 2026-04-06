import { Redis } from "ioredis";

// Standardize connection for BullMQ
export const connection = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

export const POSTS_QUEUE_NAME = "gbp-posts-schedule";
export const SCHEDULE_CHECK_JOB_ID = "schedule-checker-job";
