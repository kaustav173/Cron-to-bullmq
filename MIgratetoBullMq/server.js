import "dotenv/config";
import http from "http";
import { Worker } from "bullmq";
import { QUEUE_NAME, cronQueue } from "./queue.js";
import { connectionOptions } from "./redis.js";
import { scheduleJobs } from "./scheduler.js";
import { executeJob } from "./jobs.js";

const PORT = parseInt(process.env.PORT || "3000", 10);
const INSTANCE_ID = process.env.INSTANCE_ID || "server-1";
const NUM_WORKERS = Math.max(1, parseInt(process.env.NUM_WORKERS || "1", 10));

console.log("====================================");
console.log(`🚀 Starting ${INSTANCE_ID}`);
console.log(`Port: ${PORT}`);
console.log(`PID: ${process.pid}`);
console.log(`Configured Workers: ${NUM_WORKERS}`);
console.log(`Queue: ${QUEUE_NAME}`);
console.log("====================================");

/**
 * 1. Synchronize & register repeatable jobs in Redis via BullMQ.
 * Checks Redis first: registers new jobs, skips already existing schedules.
 */
await scheduleJobs();

/**
 * 2. Spawn workers based on NUM_WORKERS from .env
 */
const workers = [];

for (let i = 1; i <= NUM_WORKERS; i++) {
  const workerId = `${INSTANCE_ID}-w${i}`;

  const worker = new Worker(
    QUEUE_NAME,
    async (job) => {
      await executeJob(job, workerId);
    },
    {
      connection: connectionOptions,
      concurrency: 1,
    }
  );

  worker.on("ready", () => {
    console.log(`[${workerId}] Worker ready and listening for jobs.`);
  });

  worker.on("completed", (job) => {
    console.log(`[${workerId}] Completed job: ${job.name} (ID: ${job.id})`);
  });

  worker.on("failed", (job, err) => {
    console.error(`[${workerId}] Job ${job?.name} FAILED:`, err.message);
  });

  worker.on("error", (err) => {
    console.error(`[${workerId}] Worker error:`, err);
  });

  workers.push({ id: workerId, instance: worker });
}

/**
 * 3. HTTP Health-check & Status Server
 */
const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(
    JSON.stringify({
      status: "running",
      instanceId: INSTANCE_ID,
      port: PORT,
      pid: process.pid,
      activeWorkers: workers.length,
      workerIds: workers.map((w) => w.id),
      timestamp: new Date().toISOString(),
    })
  );
});

server.listen(PORT, () => {
  console.log(`[${INSTANCE_ID}] HTTP Server listening on http://localhost:${PORT}`);
  console.log("====================================");
});

/**
 * 4. Graceful Shutdown
 */
async function shutdown(signal) {
  console.log(`\n[${INSTANCE_ID}] Received ${signal}. Shutting down gracefully...`);

  // Stop HTTP server
  server.close(() => {
    console.log(`[${INSTANCE_ID}] HTTP server stopped.`);
  });

  // Stop all active BullMQ workers
  console.log(`[${INSTANCE_ID}] Stopping ${workers.length} worker(s)...`);
  await Promise.all(workers.map((w) => w.instance.close()));
  console.log(`[${INSTANCE_ID}] All workers closed.`);

  // Close queue connection
  await cronQueue.close();

  console.log(`[${INSTANCE_ID}] Shutdown complete. Goodbye!`);
  process.exit(0);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
