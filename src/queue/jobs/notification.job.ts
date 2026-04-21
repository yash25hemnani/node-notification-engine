import { logger } from "../../utils/logger";
import { notificationQueue } from "../index";

interface NotificationJobPayload {
  notificationId: string;
}

export async function enqueueNotification(
  payload: NotificationJobPayload
) {
  await notificationQueue.add("send-notification", payload, {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 30000, // 30s
    },
    removeOnComplete: true,
  });
  logger.info("Added to queue")
}