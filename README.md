# 🔁 Cron to BullMQ: Distributed Scheduling & Queue Architecture

> A complete proof-of-concept and production migration guide demonstrating how to solve multi-instance duplicate cron job execution by migrating from **`node-cron`** to **`BullMQ + Redis`**.

---

## 🗂️ Repository Structure

This repository is split into two self-contained phases:

```
Cron-to-bullmq/
├── Problem Face/            # ⚠️ Phase 1: Reproducing the Multi-Instance Cron Duplication Problem
│   ├── server.js            # Node.js server running in-memory node-cron jobs
│   ├── README.md            # Detailed analysis, logs, and architecture diagrams
│   └── assets/              # Problem architecture diagrams
│
└── MIgratetoBullMq/         # 🚀 Phase 2: Production-Grade Solution with Redis & BullMQ
    ├── server.js            # All-in-one runner: syncs scheduler & manages worker pool
    ├── scheduler.js         # Repeatable job registration with Created/Skipped idempotency
    ├── worker.js            # Distributed worker consumer process
    ├── jobs.js              # Job definitions & business logic handlers
    ├── queue.js             # Centralized BullMQ queue setup
    ├── redis.js             # Shared Redis connection options
    ├── .env.example         # Environment template
    ├── README.md            # Complete implementation, workflow & verification guide
    └── assets/              # System & sequence workflow diagrams
```

---

## ⚠️ Phase 1: The Problem (`node-cron`)

When scaling Node.js applications horizontally across multiple instances, containers, or cluster replicas, in-memory schedulers (`node-cron`) run in each process's memory.

**Consequences:**
* **Duplicate Executions:** Every instance triggers the same cron job at the same second (e.g. users receive duplicate emails).
* **Race Conditions:** Database batch jobs collide, causing deadlocks or duplicate inserts.
* **No Failover:** If an instance crashes mid-task, the job is lost forever.

👉 **See full problem demonstration & logs:** [Problem Face/README.md](./Problem%20Face/README.md)

---

## 🚀 Phase 2: The Solution (`BullMQ + Redis`)

BullMQ centralizes scheduling and queue state inside **Redis**:
1. **Centralized Repeatable Jobs:** Schedules are stored once in Redis; running multiple instances never duplicates schedules.
2. **Competing Consumer Pattern:** Multiple workers compete for tasks using Redis atomic locks (`Redlock`/Lua), guaranteeing **exactly-once execution**.
3. **High Availability & Failover:** If a worker crashes, BullMQ detects stalled jobs and automatically reassigns them to healthy workers.

👉 **See complete solution guide & verification:** [MIgratetoBullMq/README.md](./MIgratetoBullMq/README.md)

---

## ⚡ Quickstart

### Prerequisites
* **Node.js**: v18+ (Node 20+ recommended)
* **Redis**: Local instance or Docker (`docker run -d -p 6379:6379 --name redis redis:alpine`)

### 1. Reproduce the Problem
```bash
cd "Problem Face"
npm install

# Start two instances in separate terminals:
INSTANCE_ID=server-1 PORT=3001 npm start
INSTANCE_ID=server-2 PORT=3002 npm start
# Observed: Both servers fire duplicate cron jobs simultaneously!
```

### 2. Run the BullMQ Solution
```bash
cd "../MIgratetoBullMq"
npm install
cp .env.example .env

# Run all-in-one server (scheduler + worker pool + health check):
npm start
```

Or test multi-instance distributed execution:
```bash
# Terminal 1:
INSTANCE_ID=server-1 PORT=3001 NUM_WORKERS=2 npm start

# Terminal 2:
INSTANCE_ID=server-2 PORT=3002 NUM_WORKERS=2 npm start
# Observed: Jobs are distributed evenly across workers and executed EXACTLY ONCE!
```

---

## 📜 License
ISC
