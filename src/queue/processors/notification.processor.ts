import { Worker } from "bullmq";
import IORedis from "ioredis";
import { ENV } from "../../config/env";
import { logger } from "../../utils/logger";
import { Notification } from "../../db/models/index";

const connection = new IORedis({
  host: ENV.REDIS.HOST,
  port: ENV.REDIS.PORT,
});

export const notificationWorker = new Worker(
  "notifications",
  async (job) => {
    const { notificationId } = job.data;

    logger.info(`Processing notification ${notificationId}`);

    const notification = await Notification.findByPk(notificationId);

    if (!notification) {
      throw new Error("Notification not found");
    }

    try {
      // mark processing
      notification.status = "processing";
      await notification.save();

      // Simulate sending
      await new Promise((r) => setTimeout(r, 1000));

      // mark success
      notification.status = "sent";
      await notification.save();

      logger.info(`Notification sent: ${notificationId}`);
    } catch (err) {
      notification.status = "failed";
      await notification.save();

      logger.error(err, "Notification failed");

      throw err; // triggers retry
    }
  },
  { connection }
);