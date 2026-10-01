import { Queue } from "bullmq";
import { connectionOptions } from "./redis.js";

export const QUEUE_NAME = "cron-jobs";

export const cronQueue = new Queue(QUEUE_NAME, {
  connection: connectionOptions,
});