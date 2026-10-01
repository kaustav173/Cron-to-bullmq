import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ExpressAdapter } from "@bull-board/express";
import { bullBoardAuth } from "./auth.js";
import { cronQueue } from "./queue.js";

export function setupBullBoard(app) {
  const serverAdapter = new ExpressAdapter();

  serverAdapter.setBasePath("/admin/queues");

  const cronQueueAdapter = new BullMQAdapter(cronQueue, {
    description: "Scheduled cron jobs managed by BullMQ",
    allowRetries: true,
  });

  createBullBoard({
    queues: [cronQueueAdapter],
    serverAdapter,
  });

  // Protect the dashboard route with basic authentication
  app.use("/admin/queues", bullBoardAuth, serverAdapter.getRouter());

  console.log("📊 Bull Board available at /admin/queues");
}