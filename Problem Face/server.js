import cron from "node-cron";

const INSTANCE_ID = process.env.INSTANCE_ID || "server-1";
const PORT = process.env.PORT || 3000;

console.log(`====================================`);
console.log(`Starting ${INSTANCE_ID}`);
console.log(`Port: ${PORT}`);
console.log(`====================================`);


// CRON JOB 1
cron.schedule("*/10 * * * * *", () => {
    console.log(
        `[${new Date().toISOString()}] [${INSTANCE_ID}] PID=${process.pid} CRON-1 -> Send daily emails`
    );
});


// CRON JOB 2
cron.schedule("*/15 * * * * *", () => {
    console.log(
        `[${new Date().toISOString()}] [${INSTANCE_ID}] PID=${process.pid} CRON-2 -> Cleanup expired records`
    );
});


// CRON JOB 3
cron.schedule("*/20 * * * * *", () => {
    console.log(
        `[${new Date().toISOString()}] [${INSTANCE_ID}] PID=${process.pid} CRON-3 -> Generate report`
    );
});