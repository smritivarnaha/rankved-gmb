import { Queue } from "bullmq";
import { connection, POSTS_QUEUE_NAME, SCHEDULE_CHECK_JOB_ID, WATCHKEEPER_JOB_ID } from "./connection";

export const postsQueue = new Queue(POSTS_QUEUE_NAME, {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});

/**
 * Adds the repeatable job that wakes up every minute to check the DB
 * for any posts that are due to be published.
 */
export async function setupScheduleChecker() {
  await postsQueue.add(
    "check-scheduled-posts",
    {},
    {
      repeat: {
        pattern: "* * * * *", // Every minute
      },
      jobId: SCHEDULE_CHECK_JOB_ID, // Ensure only one repeatable job is created
    }
  );
  
  await postsQueue.add(
    "watchkeeper-check",
    {},
    {
      repeat: {
        pattern: "0 2 * * *", // Every day at 2:00 AM
      },
      jobId: WATCHKEEPER_JOB_ID, 
    }
  );
  
  console.log("Registered repeatable jobs for scheduled posts and watchkeeper.");
}
