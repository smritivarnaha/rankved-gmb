import { config } from "dotenv";
import path from "path";

// Load environment variables locally
config({ path: path.resolve(__dirname, "../.env.local") });

import { postWorker } from "../src/queue/post-worker";
import { setupScheduleChecker } from "../src/queue/post-queue";
import { connection } from "../src/queue/connection";

async function main() {
  console.log("Starting BullMQ Worker for GBP Post Scheduler...");
  
  // Verify Redis connection
  await connection.ping();
  console.log("Redis connection established.");

  // Register the cron-like checker
  await setupScheduleChecker();

  // Handle graceful shutdown
  const shutdown = async () => {
    console.log("Shutting down worker...");
    await postWorker.close();
    await connection.quit();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err) => {
  console.error("Worker failed to start", err);
  process.exit(1);
});
