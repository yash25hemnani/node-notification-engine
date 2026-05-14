import { Response } from "express";
import { Notification } from "../db/models";
import {
  emailWorker,
  pushWorker,
} from "../queue/processors/notification.processor";
import { ApiResponse, AuthRequest } from "../types/api";
import { unauthorized } from "../utils/api";

// Store clients per user
// Each map has userId as key and a set of that user's connections
const clients = new Map<string, Set<Response>>();

// Broadcast to a specific user only
const broadcastToUser = (userId: string, data: object) => {
  // Get all connections of a user
  const userClients = clients.get(userId);
  if (!userClients) return;
  // Send HTTP data.
  // client.write send chunks and keeps connection open
  // \n\n marks end of an event
  userClients.forEach((client) => {
    client.write(`data: ${JSON.stringify(data)}\n\n`);
  });
};

// Fetch and broadcast stats for a specific user from DB
const sendQueueStats = async (userId: string, role?: string) => {
  // Build query based on role. Admin can see all, other users can see only their data
  const buildWhereQuery = (channel: string, status: string) => ({
    ...(role !== "admin" ? { createdBy: userId } : {}),
    channel,
    status,
  });

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
    Notification.count({
      where: buildWhereQuery("email", "waiting"),
    }),
    Notification.count({
      where: buildWhereQuery("email", "active"),
    }),
    Notification.count({
      where: buildWhereQuery("email", "completed"),
    }),
    Notification.count({
      where: buildWhereQuery("email", "failed"),
    }),
    Notification.count({
      where: buildWhereQuery("push", "waiting"),
    }),
    Notification.count({
      where: buildWhereQuery("push", "active"),
    }),
    Notification.count({
      where: buildWhereQuery("push", "completed"),
    }),
    Notification.count({
      where: buildWhereQuery("push", "failed"),
    }),
  ]);

  broadcastToUser(userId, {
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
/**
 * Attach events to worker and on each event change, 
 * send the newest event and then the queue stats
 */
const attachWorkerEvents = () => {
  emailWorker.on("completed", (job) => {
    const { internalUserId } = job.data.internalUser;
    broadcastToUser(internalUserId, {
      type: "JOB_COMPLETED",
      queue: "email",
      jobId: job.id ?? "",
    });
    sendQueueStats(internalUserId);
  });

  emailWorker.on("failed", (job, err) => {
    const { internalUserId } = job?.data.internalUser;
    broadcastToUser(internalUserId, {
      type: "JOB_FAILED",
      queue: "email",
      jobId: job?.id ?? "",
      reason: err.message,
    });
    sendQueueStats(internalUserId);
  });

  emailWorker.on("active", (job) => {
    const { internalUserId } = job.data.internalUser;
    broadcastToUser(internalUserId, {
      type: "JOB_ACTIVE",
      queue: "email",
      jobId: job.id ?? "",
    });
    sendQueueStats(internalUserId);
  });

  pushWorker.on("completed", (job) => {
    const { internalUserId } = job.data.internalUser;
    broadcastToUser(internalUserId, {
      type: "JOB_COMPLETED",
      queue: "push",
      jobId: job.id ?? "",
    });
    sendQueueStats(internalUserId);
  });

  pushWorker.on("failed", (job, err) => {
    const { internalUserId } = job?.data.internalUser;
    broadcastToUser(internalUserId, {
      type: "JOB_FAILED",
      queue: "push",
      jobId: job?.id ?? "",
      reason: err.message,
    });
    sendQueueStats(internalUserId);
  });

  pushWorker.on("active", (job) => {
    const { internalUserId } = job.data.internalUser;
    broadcastToUser(internalUserId, {
      type: "JOB_ACTIVE",
      queue: "push",
      jobId: job.id ?? "",
    });
    sendQueueStats(internalUserId);
  });
};

attachWorkerEvents();

// SSE Endpoint
export const dashboardStream = async (req: AuthRequest, res: Response) => {
  if (!req.user) return unauthorized(res);
  const { id: userId } = req.user;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  // Register client under userId
  if (!clients.has(userId)) {
    clients.set(userId, new Set());
  }
  clients.get(userId)!.add(res);

  // Send initial stats for this user
  await sendQueueStats(userId, req.user.role);

  // Remove client on disconnect
  req.on("close", () => {
    const userClients = clients.get(userId);
    if (userClients) {
      userClients.delete(res);
      if (userClients.size === 0) {
        clients.delete(userId); // cleanup empty set
      }
    }
  });
};

// Getting jobs for a queue
export const getQueueJobs = async (
  req: AuthRequest,
  res: Response<ApiResponse>,
) => {
  try {
    if (!req.user) return unauthorized(res);
    const { id } = req.user;

    const { queue, state } = req.query;

    if (!queue)
      return res.status(400).json({
        success: false,
        error: {
          code: "NO_QUEUE_SPECIFIED",
          message: "Specify a queue to request data.",
        },
      });

    const where = {
      ...(req.user.role !== "admin" ? { createdBy: id } : {}),
      channel: queue as string,
      ...(state && state !== "all" ? { status: state as string } : {}),
    };

    const notifications = await Notification.findAll({
      where,
      order: [["createdAt", "DESC"]],
      limit: 20,
      attributes: [
        "id",
        "displayId",
        "channel",
        "status",
        "customerId",
        "customerEmail",
        "templateSlug",
        "attemptsMade",
        "failedReason",
        "createdAt",
      ],
    });

    return res.status(200).json({
      success: true,
      data: { jobs: notifications },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Unknown error occurred.",
      },
    });
  }
};
