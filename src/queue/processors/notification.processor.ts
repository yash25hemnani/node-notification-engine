import { Worker } from "bullmq";
import { redis } from "../index";
import { logger } from "../../utils/logger";
import {
  BrowserSubscription,
  Notification,
  Template,
} from "../../db/models/index";
import { renderTemplate } from "../../utils/template";
import { emailProvider } from "../../providers/email";
import { sendPush } from "../../providers/push";

// ── Email Worker ──────────────────────────────────────────────────────────────
export const emailWorker = new Worker(
  "email-queue",
  async (job) => {
    const { notificationId } = job.data;

    logger.info(`Processing email notification ${notificationId}`);

    const notification = await Notification.findByPk(notificationId);
    if (!notification) throw new Error("Notification not found.");

    const template = await Template.findOne({
      where: { slug: notification.template_slug, channel: "email" },
    });

    if (!template) throw new Error("Template not found.");
    if (!template.body || !template.subject)
      throw new Error("Template details not completed.");

    const renderedBody = renderTemplate(
      template.body,
      notification.data as any,
    );
    const renderedSubject = renderTemplate(
      template.subject,
      notification.data as any,
    );

    notification.status = "processing";
    await notification.save();

    try {
      await emailProvider.sendEmail(
        notification.recipient,
        renderedSubject,
        renderedBody,
      );

      notification.status = "sent";
      await notification.save();

      logger.info(`Email sent: ${notification.id}`);
    } catch (err) {
      notification.status = "failed";
      await notification.save();
      logger.error(err, "Email notification failed");
      throw err;
    }
  },
  { connection: redis },
);

// ── Push Worker ───────────────────────────────────────────────────────────────
export const pushWorker = new Worker(
  "push-queue",
  async (job) => {
    const { notificationId } = job.data;

    logger.info(`Processing push notification ${notificationId}`);

    const notification = await Notification.findByPk(notificationId);
    if (!notification) throw new Error("Notification not found.");

    const template = await Template.findOne({
      where: { slug: notification.template_slug, channel: "push" },
    });

    if (!template) throw new Error("Template not found.");
    if (!template.body || !template.subject)
      throw new Error("Template details not completed.");

    const renderedBody = renderTemplate(
      template.body,
      notification.data as any,
    );

    const subscription = await BrowserSubscription.findOne({
      where: { endpoint: notification.recipient },
    });

    if (!subscription) throw new Error("Subscription not found.");

    notification.status = "processing";
    await notification.save();

    try {
      await sendPush(subscription, {
        title: template.subject,
        body: renderedBody,
      });

      notification.status = "sent";
      await notification.save();

      logger.info(`Push sent: ${notification.id}`);
    } catch (err) {
      notification.status = "failed";
      await notification.save();
      logger.error(err, "Push notification failed");
      throw err;
    }
  },
  { connection: redis },
);
