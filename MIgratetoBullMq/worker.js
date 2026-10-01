import { Worker } from "bullmq";
import { QUEUE_NAME } from "./queue.js";
import { connectionOptions } from "./redis.js";
import { executeJob } from "./jobs.js";

const INSTANCE_ID = process.env.INSTANCE_ID || "worker-1";

console.log("====================================");
console.log(`Starting BullMQ Worker: ${INSTANCE_ID}`);
console.log(`PID: ${process.pid}`);
console.log(`Queue: ${QUEUE_NAME}`);
console.log("====================================");

/**
 * BullMQ Worker instance.
 * Multiple worker instances can run across separate processes or servers;
 * BullMQ ensures each job is assigned to exactly ONE worker at a time.
 */
export const worker = new Worker(
  QUEUE_NAME,
  async (job) => {
    await executeJob(job, INSTANCE_ID);
  },
  {
    connection: connectionOptions,
    concurrency: 1, // Number of jobs to process concurrently per worker process
  }
);

// Worker Lifecycle Events
worker.on("ready", () => {
  console.log(`[${INSTANCE_ID}] BullMQ Worker is ready and waiting for jobs...`);
});

worker.on("completed", (job) => {
  console.log(`[${INSTANCE_ID}] Completed job ${job.name} (ID: ${job.id})`);
});

worker.on("failed", (job, err) => {
  console.error(`[${INSTANCE_ID}] Job ${job?.name} (ID: ${job?.id}) FAILED:`, err.message);
});

worker.on("error", (err) => {
  console.error(`[${INSTANCE_ID}] Worker encountered an error:`, err);
});

// Graceful shutdown
async function shutdown(signal) {
  console.log(`\n[${INSTANCE_ID}] Received ${signal}. Shutting down worker gracefully...`);
  try {
    await worker.close();
    console.log(`[${INSTANCE_ID}] Worker stopped cleanly.`);
    process.exit(0);
  } catch (err) {
    console.error(`[${INSTANCE_ID}] Error during shutdown:`, err);
    process.exit(1);
  }
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));