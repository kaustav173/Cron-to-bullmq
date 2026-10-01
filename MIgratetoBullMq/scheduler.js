import { cronQueue } from "./queue.js";
import { jobDefinitions } from "./jobs.js";

/**
 * Registers all repeatable jobs into Redis centrally via BullMQ.
 * Checks whether a job scheduler is already registered:
 * - If new: Creates the job and displays '🆕 Created'
 * - If already in Redis with the same schedule: Displays '⏭️ Skipped'
 */
export async function scheduleJobs() {
  console.log("====================================");
  console.log("Checking & Registering Jobs in BullMQ...");
  console.log("====================================");

  // 1. Fetch currently active schedulers / repeatable jobs from Redis
  let existingSchedulers = [];
  try {
    if (typeof cronQueue.getJobSchedulers === "function") {
      existingSchedulers = await cronQueue.getJobSchedulers();
    }
  } catch (err) {
    // Fallback if getJobSchedulers fails
    existingSchedulers = [];
  }

  let existingRepeatable = [];
  try {
    if (typeof cronQueue.getRepeatableJobs === "function") {
      existingRepeatable = await cronQueue.getRepeatableJobs();
    }
  } catch (err) {
    existingRepeatable = [];
  }

  // Helper to find if job is already present in Redis
  const findExistingJob = (jobName, schedulerId) => {
    const foundScheduler = existingSchedulers.find(
      (s) => s.id === schedulerId || s.name === jobName
    );
    if (foundScheduler) return foundScheduler;

    const foundRepeatable = existingRepeatable.find(
      (r) => r.name === jobName || r.id === schedulerId || r.key?.includes(jobName)
    );
    return foundRepeatable || null;
  };

  for (const job of jobDefinitions) {
    const schedulerId = `scheduler-${job.name}`;
    const existing = findExistingJob(job.name, schedulerId);

    if (existing) {
      console.log(
        `⏭️  Skipped [${job.name}] -> Already exists in Redis with pattern: "${job.pattern}"`
      );
      continue;
    }

    try {
      if (typeof cronQueue.upsertJobScheduler === "function") {
        await cronQueue.upsertJobScheduler(
          schedulerId,
          { pattern: job.pattern },
          {
            name: job.name,
            data: job.data,
            opts: {
              removeOnComplete: true,
              removeOnFail: 50,
            },
          }
        );
      } else {
        await cronQueue.add(job.name, job.data, {
          repeat: { pattern: job.pattern },
          jobId: schedulerId,
          removeOnComplete: true,
          removeOnFail: 50,
        });
      }

      console.log(`🆕 Created [${job.name}] with pattern: "${job.pattern}"`);
    } catch (err) {
      console.error(`❌ Failed to create [${job.name}]:`, err.message);
    }
  }

  console.log("====================================");
  console.log("Scheduler sync complete!");
  console.log("====================================");
}

// Auto-run if executed directly via `node scheduler.js` or `npm run scheduler`
if (process.argv[1] && process.argv[1].endsWith("scheduler.js")) {
  scheduleJobs()
    .then(async () => {
      await cronQueue.close();
      process.exit(0);
    })
    .catch((err) => {
      console.error("Scheduler initialization failed:", err);
      process.exit(1);
    });
}