/**
 * Job names and definitions migrated from node-cron
 */
export const JOB_NAMES = {
  DAILY_EMAILS: "send-daily-emails",
  CLEANUP_RECORDS: "cleanup-expired-records",
  GENERATE_REPORT: "generate-report",
};


export const jobDefinitions = [
  {
    name: JOB_NAMES.DAILY_EMAILS,
    pattern: "*/10 * * * * *",
    data: { description: "Send daily emails" },
  },
  {
    name: JOB_NAMES.CLEANUP_RECORDS,
    pattern: "*/15 * * * * *",
    data: { description: "Cleanup expired records" },
  },
  {
    name: JOB_NAMES.GENERATE_REPORT,
    pattern: "*/20 * * * * *",
    data: { description: "Generate report" },
  },
];

/**
 * Executes the business logic for a given job.
 */
export async function executeJob(job, instanceId) {
  const timestamp = new Date().toISOString();
  const pid = process.pid;

  switch (job.name) {
    case JOB_NAMES.DAILY_EMAILS:
      console.log(
        `[${timestamp}] [${instanceId}] PID=${pid} (Job ID: ${job.id}) -> Executing: ${job.data.description}`
      );
      break;

    case JOB_NAMES.CLEANUP_RECORDS:
      console.log(
        `[${timestamp}] [${instanceId}] PID=${pid} (Job ID: ${job.id}) -> Executing: ${job.data.description}`
      );
      break;

    case JOB_NAMES.GENERATE_REPORT:
      console.log(
        `[${timestamp}] [${instanceId}] PID=${pid} (Job ID: ${job.id}) -> Executing: ${job.data.description}`
      );
      break;

    default:
      console.warn(`[${timestamp}] [${instanceId}] Unknown job: ${job.name}`);
  }
}