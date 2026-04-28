import { logger } from "../../utils/logger";
import { emailQueue
       , pushQueue 
       } from "../index";

interface NotificationJobPayload {
  notificationId: string;
}

export async function enqueueNotification(
  payload: NotificationJobPayload,
  channel: "email" | "push"
) {
  if (channel === "email") {
    await emailQueue.add("send-email", payload, {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 30000, // 30s
      },
      removeOnComplete: true,
    });
    logger.info("Added to queue")
  }
  
  if (channel === "push") {
    await pushQueue.add("send-push", payload, {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 30000, // 30s
      },
      removeOnComplete: true,
    });
    logger.info("Added to queue")
  }
}