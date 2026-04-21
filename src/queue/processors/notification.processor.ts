import { Worker } from "bullmq";
import IORedis from "ioredis";
import { ENV } from "../../config/env";
import { logger } from "../../utils/logger";
import { BrowserSubscription, Notification, Template } from "../../db/models/index";
import { renderTemplate } from "../../utils/template";
import { emailProvider } from "../../providers/email";
import { sendPush } from "../../providers/push";

const connection = new IORedis({
  host: ENV.REDIS.HOST,
  port: ENV.REDIS.PORT,

  maxRetriesPerRequest: null,
  enableReadyCheck: false,
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

    // Check if requested template exists
    const template = await Template.findOne({
      where: {
        slug: notification.template_slug,
        channel: notification.channel,
      },
    });

    if (!template) throw new Error("Template not found");

    // Render the template with data if found
    const renderedBody = renderTemplate(
      template.body,
      notification.data as any,
    );

    // mark processing
    notification.status = "processing";
    await notification.save();

    try {
      // Send Email Notification
      if (notification.channel === "email") {
        const subject = template.subject
          ? renderTemplate(template.subject, notification.data as any)
          : "Notification";

        await emailProvider.sendEmail(
          notification.recipient,
          subject,
          renderedBody,
        );
      }

      // Send Push Notification
      if (notification.channel === "push") {
        const subscription = await BrowserSubscription.findOne({
          where: { endpoint: notification.recipient },
        });

        if (!subscription) {
          throw new Error("Subscription not found");
        }

        await sendPush(subscription, {
          title: template.subject || "Notification",
          body: renderedBody,
        });
      }

      notification.status = "sent";
      await notification.save();

      logger.info(`Sent: ${notification.id}`);
    } catch (err) {
      notification.status = "failed";
      await notification.save();

      logger.error(err, "Notification failed");

      throw err; // triggers retry
    }
  },
  { connection },
);
