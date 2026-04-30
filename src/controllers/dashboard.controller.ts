import { Response } from "express";
import {
  emailWorker,
  pushWorker,
} from "../queue/processors/notification.processor";
import { emailQueue, pushQueue } from "../queue";
import { ApiResponse, AuthRequest } from "../types/api";
import { Job, JobType } from "bullmq";
import { unauthorized } from "../utils/api";

// Store connected clients
const clients = new Set<Response>();

// Push update to all onboarded clients
const broadcast = (data: object) => {
  clients.forEach((client) => {
    client.write(`data: ${JSON.stringify(data)}\n\n`);
  });
};

// Fetch and broadcast current stats
const sendQueueStats = async () => {
  const [
    emailWaiting,
    emailActive,
    emailCompleted,
    emailFailed,
    pushWaiting,
    pushActive,
    pushCompleted,
    pushFailed,
  ] = await Promise.all([
    emailQueue.getWaitingCount(),
    emailQueue.getActiveCount(),
    emailQueue.getCompletedCount(),
    emailQueue.getFailedCount(),
    pushQueue.getWaitingCount(),
    pushQueue.getActiveCount(),
    pushQueue.getCompletedCount(),
    pushQueue.getFailedCount(),
  ]);

  broadcast({
    type: "QUEUE_STATS",
    email: {
      waiting: emailWaiting,
      active: emailActive,
      completed: emailCompleted,
      failed: emailFailed,
    },
    push: {
      waiting: pushWaiting,
      active: pushActive,
      completed: pushCompleted,
      failed: pushFailed,
    },
  });
};

// Attach worker event listeners once
const attachWorkerEvents = () => {
  emailWorker.on("completed", (job) => {
    broadcast({ type: "JOB_COMPLETED", queue: "email", jobId: job.id ?? "" });
    sendQueueStats();
  });

  emailWorker.on("failed", (job, err) => {
    broadcast({
      type: "JOB_FAILED",
      queue: "email",
      jobId: job?.id ?? "",
      reason: err.message,
    });
    sendQueueStats();
  });

  emailWorker.on("active", (job) => {
    broadcast({ type: "JOB_ACTIVE", queue: "email", jobId: job.id ?? "" });
    sendQueueStats();
  });

  pushWorker.on("completed", (job) => {
    broadcast({ type: "JOB_COMPLETED", queue: "push", jobId: job.id ?? "" });
    sendQueueStats();
  });

  pushWorker.on("failed", (job, err) => {
    broadcast({
      type: "JOB_FAILED",
      queue: "push",
      jobId: job?.id ?? "",
      reason: err.message,
    });
    sendQueueStats();
  });

  pushWorker.on("active", (job) => {
    broadcast({ type: "JOB_ACTIVE", queue: "push", jobId: job.id ?? "" });
    sendQueueStats();
  });
};

attachWorkerEvents();

// SSE Endpoint
export const dashboardStream = async (req: AuthRequest, res: Response) => {
  // Set SSE Headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  // Add Clients
  clients.add(res);

  // Send initial stats on connect
  await sendQueueStats();

  // Remove client on disconnect
  req.on("close", () => {
    clients.delete(res);
  });
};

// Getting jobs for a queue
export const getQueueJobs = async (
  req: AuthRequest,
  res: Response<ApiResponse>,
) => {
  if (!req.user) return unauthorized(res);
  const { id } = req.user;

  const { queue, state } = req.query;

  const requestedState =
    state === "all"
      ? ["waiting", "active", "completed", "failed"]
      : [state as string];

  if (!queue)
    return res.status(400).json({
      success: false,
      error: {
        code: "NO_QUEUE_SPECIFIED",
        message: "Specify a queue to request data.",
      },
    });

  const selectedQueue = queue === "push" ? pushQueue : emailQueue;

  const jobs = await selectedQueue.getJobs(requestedState as JobType[], 0, 20);

  // Each job payload includes the following in data:
  // - notificationId: unique notification record identifier
  // - internalUser.internalUser: owning user identifier
  //
  // Use these fields to:
  // - Fetch notifications for a specific internal user

  const userJobs = jobs.filter((job) => {
    const {internalUserId} = job.data.internalUser;
    return internalUserId === id;
  });

  return res.status(200).json({
    success: true,
    data: {
      jobs: userJobs.map((j) => j.toJSON()),
    },
  });
};
