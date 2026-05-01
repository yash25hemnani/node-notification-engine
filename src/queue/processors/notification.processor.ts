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
    const { notificationId, internalUser } = job.data;
    const { internalUserId } = internalUser;

    logger.info(`Processing email notification ${notificationId}`);

    const notification = await Notification.findByPk(notificationId);
    if (!notification) throw new Error("Notification not found.");

    // Set job Id
    notification.jobId = job.id ?? "";
    await notification.save();

    const template = await Template.findOne({
      where: {
        slug: notification.templateSlug,
        channel: "email",
        userId: internalUserId,
      },
    });

    if (!template) throw new Error("Template not found.");
    if (!template.body || !template.subject)
      throw new Error("Template details not completed.");

    logger.info("Template found.");

    const renderedBody = renderTemplate(
      template.body,
      notification.data as any,
    );

    const renderedSubject = renderTemplate(
      template.subject,
      notification.data as any,
    );

    logger.info("Body/Subject rendered.");

    notification.status = "active";
    await notification.save();

    try {
      await emailProvider.sendEmail(
        notification.recipient,
        renderedSubject,
        renderedBody,
      );

      notification.status = "completed";
      notification.attemptsMade = job.attemptsMade;
      await notification.save();

      logger.info(`Email sent: ${notification.id}`);
    } catch (err: any) {
      notification.status = "failed";
      notification.attemptsMade = job.attemptsMade;
      notification.failedReason = err.message;
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
    const { notificationId, internalUser } = job.data;
    console.log(internalUser);

    const { internalUserId } = internalUser;
    console.log(internalUserId);

    logger.info(`Processing push notification ${notificationId}`);

    const notification = await Notification.findByPk(notificationId);
    if (!notification) throw new Error("Notification not found.");

    notification.jobId = job.id ?? "";
    await notification.save();

    const template = await Template.findOne({
      where: {
        slug: notification.templateSlug,
        channel: "push",
        userId: internalUserId,
      },
    });

    if (!template) throw new Error("Template not found.");
    if (!template.body || !template.subject)
      throw new Error("Template details not completed.");

    logger.info("Template found");

    const renderedBody = renderTemplate(
      template.body,
      notification.data as any,
    );

    const subscription = await BrowserSubscription.findOne({
      where: { endpoint: notification.recipient },
    });

    if (!subscription) throw new Error("Subscription not found.");

    logger.info("Subscription found");

    notification.status = "active";
    await notification.save();

    try {
      await sendPush(subscription, {
        title: template.subject,
        body: renderedBody,
      });

      notification.status = "completed";
      notification.attemptsMade = job.attemptsMade;
      await notification.save();

      logger.info(`Push sent: ${notification.id}`);
    } catch (err: any) {
      notification.status = "failed";
      notification.attemptsMade = job.attemptsMade;
      notification.failedReason = err.message;
      await notification.save();
      logger.error(err, "Push notification failed");
      throw err;
    }
  },
  { connection: redis },
);
