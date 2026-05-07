import { Request, Response } from "express";
import {
  BrowserSubscription,
  EmailNotificationDetail,
  Notification,
  Template,
  TemplateAttachment,
  UploadedFile,
  User,
} from "../db/models";
import { enqueueNotification } from "../queue/jobs/notification.job";
import { logger } from "../utils/logger";
import { ApiKeyRequest, ApiResponse, AuthRequest } from "../types/api";
import { unauthorized } from "../utils/api";
import fs from "fs";

export const uploadEmailAttachments = async (
  req: ApiKeyRequest,
  res: Response<ApiResponse>,
) => {
  try {
    if (!req.apiKey) return unauthorized(res);

    const { userId: internalUserId } = req.apiKey;

    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: "NO_FILES",
          message: "No files were uploaded.",
        },
      });
    }

    const uploads = await Promise.all(
      files.map((file) =>
        UploadedFile.create({
          filename: file.filename,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          path: file.path,
          uploadedBy: String(internalUserId),
        }),
      ),
    );

    const paths = uploads.map((upload) => ({
      path: upload.path,
      originalname: upload.originalName,
    }));

    return res.status(200).json({
      success: true,
      data: {
        paths,
      },
    });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Internal server error occurred.",
      },
    });
  }
};

// ── Create Email Notification ─────────────────────────────────────────────────
export const createEmailNotification = async (
  req: ApiKeyRequest,
  res: Response<ApiResponse>,
) => {
  try {
    if (!req.apiKey) return unauthorized(res);

    const { userId: internalUserId } = req.apiKey;

    const {
      customerId,
      customerEmail,
      templateSlug,
      data,
      cc,
      bcc,
      replyTo,
      filePaths, // Array of file paths
      uploadedPaths, // Array of objects upload original name and paths
    } = req.body;

    const to: string[] = req.body.to?.length ? req.body.to : [customerEmail];

    const template = await Template.findOne({
      where: { slug: templateSlug, userId: internalUserId, channel: "email" },
    });

    if (!template)
      return res.status(404).json({
        success: false,
        error: {
          code: "TEMPLATE_NOT_FOUND",
          message: "Template does not exist.",
        },
      });

    const idempotencyKey = req.header("Idempotency-Key");

    if (idempotencyKey) {
      const existing = await Notification.findOne({
        where: { idempotencyKey },
      });
      if (existing) {
        return res.status(200).json({
          success: true,
          data: { message: "Already processed", id: existing.id },
        });
      }
    }

    const notification = await Notification.create({
      channel: "email",
      customerId,
      customerEmail,
      recipient: customerEmail,
      templateId: template.id,
      templateSnapshot: {
        subject: template.subject,
        body: template.body,
      },
      templateSlug,
      data,
      status: "waiting",
      idempotencyKey: idempotencyKey || null,
      createdBy: internalUserId,
    });

    await EmailNotificationDetail.create({
      notificationId: notification.id,
      to,
      cc: cc || null,
      bcc: bcc || null,
      replyTo: replyTo || null,
    });

    logger.info("Email notification created");

    /**
     * If req.files exists
     * If filePaths are send, send them to the worker directly, nodemailer handles them directly.
     */

    if (filePaths.length > 0) {
      console.log("File Paths Recevied");
      console.log(filePaths);
      filePaths.forEach((filePath: string) => {
        if (!fs.existsSync(filePath)) {
          return res.status(404).json({
            success: false,
            error: {
              code: "FILE_NOT_FOUND_ON_DISK",
              message: "File no longer exists on disk.",
            },
          });
        }
      });
      console.log("File paths existing");
    }

    if (uploadedPaths && uploadedPaths.length > 0) {
      for (const file of uploadedPaths) {
        if (!fs.existsSync(file.path)) {
          return res.status(404).json({
            success: false,
            error: {
              code: "FILE_NOT_FOUND_ON_DISK",
              message: `File ${file.originalName} no longer exists on disk.`,
            },
          });
        }
      }
    }

    await enqueueNotification(
      {
        notificationId: notification.id,
        internalUser: { internalUserId },
        ...(filePaths.length > 0 ? { filePaths } : {}),
        ...(uploadedPaths.length > 0 ? { uploadedPaths } : {}),
      },
      "email",
    );

    return res.status(201).json({
      success: true,
      data: { message: "Email notification queued", id: notification.id },
    });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Internal server error occurred.",
      },
    });
  }
};

// ── Create Push Notification ──────────────────────────────────────────────────
export const createPushNotification = async (
  req: ApiKeyRequest,
  res: Response<ApiResponse>,
) => {
  try {
    if (!req.apiKey) return unauthorized(res);

    const { userId: internalUserId } = req.apiKey;

    const { customerId, customerEmail, templateSlug, data } = req.body;

    const template = await Template.findOne({
      where: { slug: templateSlug, userId: internalUserId, channel: "push" },
    });

    if (!template)
      return res.status(404).json({
        success: false,
        error: {
          code: "TEMPLATE_NOT_FOUND",
          message: "Template does not exist.",
        },
      });

    const idempotencyKey = req.header("Idempotency-Key");

    if (idempotencyKey) {
      const existing = await Notification.findOne({
        where: { idempotencyKey },
      });
      if (existing) {
        return res.status(200).json({
          success: true,
          data: { message: "Already processed", id: existing.id },
        });
      }
    }

    const subscriptions = await BrowserSubscription.findAll({
      where: { customerId },
    });

    if (!subscriptions.length)
      return res.status(404).json({
        success: false,
        error: {
          code: "SUBSCRIPTION_NOT_FOUND",
          message: "Customer not subscribed.",
        },
      });

    const notifications = await Promise.all(
      subscriptions.map((sub) =>
        Notification.create({
          channel: "push",
          customerId,
          customerEmail,
          recipient: sub.endpoint,
          templateId: template.id,
          templateSnapshot: {
            subject: template.subject,
            body: template.body,
          },
          templateSlug,
          data,
          status: "waiting",
          idempotencyKey: idempotencyKey || null,
          createdBy: internalUserId,
        }),
      ),
    );

    logger.info("Push notifications created");

    await Promise.all(
      notifications.map((notification) =>
        enqueueNotification(
          { notificationId: notification.id, internalUser: { internalUserId } },
          "push",
        ),
      ),
    );

    return res.status(201).json({
      success: true,
      data: {
        message: "Push notifications queued",
        ids: notifications.map((n) => n.id),
      },
    });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Internal server error occurred.",
      },
    });
  }
};

// ── Send Test Email Notification ──────────────────────────────────────────────
export const sendTestEmailNotification = async (
  req: AuthRequest,
  res: Response<ApiResponse>,
) => {
  try {
    if (!req.user) return unauthorized(res);

    const { id } = req.user;

    const user = await User.findOne({ where: { id } });

    if (!user)
      return res.status(404).json({
        success: false,
        error: { code: "USER_NOT_FOUND", message: "User not found." },
      });

    const { templateSlug, data, cc, bcc, replyTo } = req.body;

    const to: string[] = req.body.to?.length ? req.body.to : [user.email];

    const template = await Template.findOne({
      where: { slug: templateSlug, channel: "email", userId: user.id },
    });

    if (!template)
      return res.status(404).json({
        success: false,
        error: {
          code: "TEMPLATE_NOT_FOUND",
          message: "Template with given slug not found.",
        },
      });

    if (!template.body || !template.subject)
      return res.status(400).json({
        success: false,
        error: {
          code: "TEMPLATE_NOT_COMPLETE",
          message: "Template doesn't have subject or body.",
        },
      });

    const idempotencyKey = req.header("Idempotency-Key");

    if (idempotencyKey) {
      const existing = await Notification.findOne({
        where: { idempotencyKey },
      });
      if (existing) {
        return res.status(200).json({
          success: true,
          data: { message: "Already processed", id: existing.id },
        });
      }
    }

    const notification = await Notification.create({
      channel: "email",
      customerId: id,
      customerEmail: user.email,
      recipient: user.email,
      templateId: template.id,
      templateSnapshot: {
        subject: template.subject,
        body: template.body,
      },
      templateSlug,
      data,
      status: "waiting",
      idempotencyKey: idempotencyKey || null,
      createdBy: id,
    });

    await EmailNotificationDetail.create({
      notificationId: notification.id,
      to,
      cc: cc || null,
      bcc: bcc || null,
      replyTo: replyTo || null,
    });

    logger.info("Test email notification created");

    await enqueueNotification(
      { notificationId: notification.id, internalUser: { internalUserId: id } },
      "email",
    );

    return res.status(201).json({
      success: true,
      data: { message: "Email notification queued", id: notification.id },
    });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Internal server error occurred.",
      },
    });
  }
};

// ── Send Test Push Notification ───────────────────────────────────────────────
export const sendTestPushNotification = async (
  req: AuthRequest,
  res: Response<ApiResponse>,
) => {
  try {
    if (!req.user) return unauthorized(res);

    const { id } = req.user;

    const user = await User.findOne({ where: { id } });

    if (!user)
      return res.status(404).json({
        success: false,
        error: { code: "USER_NOT_FOUND", message: "User not found." },
      });

    const { templateSlug, data } = req.body;

    const template = await Template.findOne({
      where: { slug: templateSlug, channel: "push", userId: user.id },
    });

    if (!template)
      return res.status(404).json({
        success: false,
        error: {
          code: "TEMPLATE_NOT_FOUND",
          message: "Template with given slug not found.",
        },
      });

    if (!template.body || !template.subject)
      return res.status(400).json({
        success: false,
        error: {
          code: "TEMPLATE_NOT_COMPLETE",
          message: "Template doesn't have subject or body.",
        },
      });

    const idempotencyKey = req.header("Idempotency-Key");

    if (idempotencyKey) {
      const existing = await Notification.findOne({
        where: { idempotencyKey },
      });
      if (existing) {
        return res.status(200).json({
          success: true,
          data: { message: "Already processed", id: existing.id },
        });
      }
    }

    const subscriptions = await BrowserSubscription.findAll({
      where: { customerId: id },
    });

    if (!subscriptions.length)
      return res.status(404).json({
        success: false,
        error: {
          code: "SUBSCRIPTION_NOT_FOUND",
          message: "User is not subscribed to push notifications.",
        },
      });

    const notifications = await Promise.all(
      subscriptions.map((sub) =>
        Notification.create({
          channel: "push",
          customerId: id,
          customerEmail: user.email,
          recipient: sub.endpoint,
          templateId: template.id,
          templateSnapshot: {
            subject: template.subject,
            body: template.body,
          },
          templateSlug,
          data,
          status: "waiting",
          idempotencyKey: idempotencyKey || null,
          createdBy: id,
        }),
      ),
    );

    logger.info("Test push notifications created");

    await Promise.all(
      notifications.map((notification) =>
        enqueueNotification(
          {
            notificationId: notification.id,
            internalUser: { internalUserId: id },
          },
          "push",
        ),
      ),
    );

    return res.status(201).json({
      success: true,
      data: {
        message: "Push notifications queued",
        ids: notifications.map((n) => n.id),
      },
    });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Internal server error occurred.",
      },
    });
  }
};

// ── Delete Notification ───────────────────────────────────────────────────────
export const deleteNotification = async (
  req: AuthRequest,
  res: Response<ApiResponse>,
) => {
  try {
    if (!req.user) return unauthorized(res);

    const { notificationId } = req.params;

    if (!notificationId)
      return res.status(400).json({
        success: false,
        error: { code: "BAD_REQUEST", message: "Notification ID not provided" },
      });

    const existingNotification = await Notification.findOne({
      where: { id: notificationId },
    });

    if (!existingNotification)
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Notification not found" },
      });

    await existingNotification.destroy();

    return res.status(200).json({
      success: true,
      data: { id: notificationId },
    });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Unknown error occurred.",
      },
    });
  }
};

// ── Get Queue Notifications ───────────────────────────────────────────────────
export const getQueueNotifications = async (
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
      createdBy: id,
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
    logger.error(error);
    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Unknown error occurred.",
      },
    });
  }
};

// ── Get Single Notification ──────────────────────────────────────────────────
export const getSingleNotification = async (
  req: AuthRequest,
  res: Response<ApiResponse>,
) => {
  try {
    if (!req.user) return unauthorized(res);

    const { id: userId } = req.user;
    const { notificationId } = req.params;

    const notification = await Notification.findOne({
      where: { id: notificationId, createdBy: userId },
      include: [
        {
          model: EmailNotificationDetail,
          as: "emailDetail",
        },
      ],
    });

    if (!notification)
      return res.status(404).json({
        success: false,
        error: {
          code: "NOTIFICATION_NOT_FOUND",
          message: "Notification not found.",
        },
      });

    

    return res.status(200).json({
      success: true,
      data: { notification },
    });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Unknown error occurred.",
      },
    });
  }
};
