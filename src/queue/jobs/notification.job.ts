import { logger } from "../../utils/logger";
import { emailQueue, pushQueue } from "../index";

interface NotificationJobPayload {
  notificationId: string;
  internalUser: {
    internalUserId: string;
  };
}

export async function enqueueNotification(
  payload: NotificationJobPayload,
  channel: "email" | "push",
) {
  if (channel === "email") {
    await emailQueue.add("send-email", payload, {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 30000, // 30s
      },
      removeOnComplete: {
        age: 3600, // keep completed jobs for 1 hour
        count: 100, // keep last 100 completed jobs
      },
      removeOnFail: {
        age: 24 * 3600, // keep failed jobs for 24 hours
      },
    });
    logger.info("Added to queue");
  }

  if (channel === "push") {
    await pushQueue.add("send-push", payload, {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 30000, // 30s
      },
      removeOnComplete: {
        age: 3600, // keep completed jobs for 1 hour
        count: 100, // keep last 100 completed jobs
      },
      removeOnFail: {
        age: 24 * 3600, // keep failed jobs for 24 hours
      },
    });
    logger.info("Added to queue");
  }
}
