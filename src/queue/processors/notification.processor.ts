import { UnrecoverableError, Worker } from "bullmq";
import { redis } from "../index";
import { logger } from "../../utils/logger";
import {
  BrowserSubscription,
  EmailNotificationDetail,
  Notification,
  Template,
  TemplateAttachment,
  UploadedFile,
} from "../../db/models/index";
import { renderTemplate } from "../../utils/template";
import { emailProvider } from "../../providers/email";
import { sendPush } from "../../providers/push";
import path from "node:path";
import { log } from "node:console";

// ── Email Worker ──────────────────────────────────────────────────────────────
export const emailWorker = new Worker(
  "email-queue",
  async (job) => {
    const { notificationId, internalUser, filePaths, uploadedPaths } = job.data;
    const { internalUserId } = internalUser;

    logger.info(`Processing email notification ${notificationId}`);

    const notification = await Notification.findByPk(notificationId);
    if (!notification) throw new Error("Notification not found.");

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

    const emailDetail = await EmailNotificationDetail.findOne({
      where: { notificationId: notification.id },
    });

    if (!emailDetail) throw new Error("Email notification detail not found.");

    logger.info("Email detail found.");

    notification.status = "active";
    await notification.save();

    const attachments = await TemplateAttachment.findAll({
      where: { templateId: template.id },
      include: [
        {
          model: UploadedFile,
          as: "file",
          attributes: ["path", "originalName"], // path included here
        },
      ],
    });

    if (attachments.length > 0) {
      await notification.update({
        templateSnapshot: {
          ...notification.templateSnapshot,
          attachments: attachments.map((a) => ({
            id: a.id,
            file: {
              path: a.file.path,
              originalName: a.file.originalName,
            },
            mimeType: a.mimeType,
            source: "upload",
          })),
        },
      });
    } else {
      logger.info("No attachments found for template.");
    }

    // Map to nodemailer format
    const mailAttachments =
      attachments.length > 0
        ? attachments.map((a) => ({
            filename: a.file.originalName,
            path: path.join(process.cwd(), a.file.path),
          }))
        : [];

    console.log("Mail Attachments from template:", mailAttachments);

    console.log("File paths: ", filePaths);

    // If filePaths exist, add them to mail attachments as well
    if (filePaths && filePaths.length > 0) {
      console.log("Worker received file paths");
      filePaths.forEach((filePath: string) => {
        const filename = path.basename(filePath);
        mailAttachments.push({
          filename,
          path: filePath,
        });
      });
      console.log("added to attachment list");
    } else {
      logger.info("No file paths provided in job data.");
    }

    if (uploadedPaths && uploadedPaths.length > 0) {
      console.log("Worker received uploaded file paths");
      uploadedPaths.forEach((file: { originalname: string; path: string }) => {
        mailAttachments.push({
          filename: file.originalname,
          path: file.path,
        });
      });
      console.log("Added uploaded files to attachment list");
    } else {
      logger.info("No uploaded file paths provided in job data.");
    }

    try {
      await emailProvider.sendEmail(
        notification.recipient,
        renderedSubject,
        renderedBody,
        {
          to: emailDetail.to,
          cc: emailDetail.cc ?? undefined,
          bcc: emailDetail.bcc ?? undefined,
          replyTo: emailDetail.replyTo ?? undefined,
          attachments: mailAttachments,
        },
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


export const pushWorker = new Worker(
  "push-queue",
  async (job) => {
    const { notificationId, internalUser } = job.data;
    const { internalUserId } = internalUser;

    logger.info(`Processing push notification ${notificationId}`);

    const notification = await Notification.findByPk(notificationId);
    if (!notification) throw new UnrecoverableError("Notification not found.");

    notification.jobId = job.id ?? "";
    await notification.save();

    const template = await Template.findOne({
      where: {
        slug: notification.templateSlug,
        channel: "push",
        userId: internalUserId,
      },
    });

    // Template missing or incomplete — no point retrying, fail immediately
    if (!template) {
      throw new UnrecoverableError("Template not found.");
    }
    if (!template.body || !template.subject) {
      throw new UnrecoverableError("Template details not completed.");
    }

    logger.info("Template found");

    const renderedBody = renderTemplate(
      template.body,
      notification.data as any,
    );

    const subscription = await BrowserSubscription.findOne({
      where: { endpoint: notification.recipient },
    });

    // Subscription doesn't exist locally — no point retrying
    if (!subscription) {
      notification.status = "failed";
      notification.failedReason = "Subscription no longer exists.";
      await notification.save();
      logger.warn(`Subscription not found for endpoint, skipping.`);
      throw new UnrecoverableError("Subscription not found, skipping retries.");
    }

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
      const statusCode = err.statusCode as number | undefined;

      if (statusCode === 410 || statusCode === 403) {
        // 410 = subscription expired, 403 = VAPID key mismatch
        // Both mean the subscription is permanently invalid — delete and don't retry
        await subscription.destroy();
        logger.warn(
          `Subscription removed (${statusCode}): ${subscription.id}`,
        );

        notification.status = "failed";
        notification.attemptsMade = job.attemptsMade;
        notification.failedReason = err.message;
        await notification.save();

        // UnrecoverableError prevents BullMQ from retrying a known-dead subscription
        throw new UnrecoverableError(
          `Subscription permanently invalid (${statusCode}), removed.`,
        );
      }

      // For all other errors (5xx, network issues etc.) — update notification
      // and re-throw a normal error so BullMQ retries per queue config
      notification.status = "failed";
      notification.attemptsMade = job.attemptsMade;
      notification.failedReason = err.message;
      await notification.save();

      logger.error(err, `Push failed (retryable): ${notification.id}`);
      throw err;
    }
  },
  { connection: redis },
);