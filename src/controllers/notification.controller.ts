import { Response } from "express";
import fs from "fs";
import mime from "mime-types";
import path from "path";
import { Op } from "sequelize";
import {
  BrowserSubscription,
  EmailNotificationDetail,
  Notification,
  Template,
  UploadedFile,
  User,
} from "../db/models";
import { enqueueNotification } from "../queue/jobs/notification.job";
import { ApiKeyRequest, ApiResponse, AuthRequest } from "../types/api";
import { unauthorized } from "../utils/api";
import { logger } from "../utils/logger";
import {
  buildPaginatedResponse,
  getPaginationParams,
} from "../utils/pagination";
import { renderTemplate } from "../utils/template";

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

    // Get relative path since Express.Multer.File returns full path
    const fileData = files.map((file) => ({
      ...file,
      path: file.path.replace(/\\/g, "/").split("uploads/")[1]
        ? `uploads/${file.path.replace(/\\/g, "/").split("uploads/")[1]}`
        : file.path,
    }));

    // Upload all files
    const uploads = await Promise.all(
      fileData.map((file) =>
        UploadedFile.create({
          filename: file.filename,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          path: file.path, // now relative
          uploadedBy: String(internalUserId),
          source: "upload",
        }),
      ),
    );

    const paths = uploads.map((upload) => ({
      id: upload.id,
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

    const { customerId, customerEmail, templateSlug, data, cc, bcc, replyTo } =
      req.body;

    const to: string[] = req.body.to?.length ? req.body.to : [customerEmail];

    const filePaths: string[] = req.body.filePaths ?? [];

    const uploadedPaths: { id: string; path: string; originalName: string }[] =
      req.body.uploadedPaths ?? [];

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

    // ── Validate all file paths before touching the DB
    for (const filePath of filePaths) {
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          success: false,
          error: {
            code: "FILE_NOT_FOUND_ON_DISK",
            message: `File ${path.basename(filePath)} does not exist on disk.`,
          },
        });
      }
    }

    for (const file of uploadedPaths) {
      if (!fs.existsSync(file.path)) {
        return res.status(404).json({
          success: false,
          error: {
            code: "FILE_NOT_FOUND_ON_DISK",
            message: `File ${file.originalName} does not exist on disk.`,
          },
        });
      }
    }

    // ── Create notification ──────────────────────────────────────────
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

    // ── Create UploadedFile records for local file paths ─────────────
    for (const filePath of filePaths) {
      await UploadedFile.create({
        filename: path.basename(filePath),
        originalName: path.basename(filePath),
        mimeType: mime.lookup(filePath) || "application/octet-stream",
        size: fs.statSync(filePath).size,
        path: filePath,
        notificationId: notification.id,
        source: "local",
      });
    }

    // ── Link already-uploaded files to this notification ─────────────
    for (const file of uploadedPaths) {
      await UploadedFile.update(
        { notificationId: notification.id },
        { where: { id: file.id } },
      );
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
      where: { customerEmail },
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

export const getCustomerPushNotifications = async (
  req: ApiKeyRequest,
  res: Response<ApiResponse>,
) => {
  try {
    if (!req.apiKey) return unauthorized(res);
    console.log(req.apiKey)
    const { page, limit, offset } = getPaginationParams(req.query);
    const { customerEmail } = req.query;

    if (!customerEmail)
      return res.status(400).json({
        success: false,
        error: {
          code: "NO_EMAIL_PROVIDED",
          message: "Customer email not provided.",
        },
      });

    const { count, rows: Notifications } = await Notification.findAndCountAll({
      where: { customerEmail: customerEmail as string, channel: "push" },
      attributes: ["id", "customerEmail", "templateSnapshot", "isRead", "data"],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });

    if (count === 0) {
      return res.status(404).json({
        success: false,
        error: { code: "NO_DATA_FOUND", message: "No data found." },
      });
    }

    const mappedNotifications = Notifications.map((n) => {
      const templateSnapshot = n.templateSnapshot as {
        title: string;
        body: string;
      };

      const isDataEmpty = Object.keys(n.data ?? {}).length === 0;

      const renderedTitle = !isDataEmpty
        ? renderTemplate(templateSnapshot.title, n.data)
        : templateSnapshot.title;

      const renderedBody = !isDataEmpty
        ? renderTemplate(templateSnapshot.body, n.data)
        : templateSnapshot.body;

      return {
        ...n,
        renderedTitle,
        renderedBody,
      };
    });

    return res.status(200).json(
      buildPaginatedResponse(mappedNotifications, count, {
        page,
        limit,
        offset,
      }),
    );
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

export const markAsRead = async (
  req: ApiKeyRequest,
  res: Response<ApiResponse>,
) => {
  try {
    if (!req.apiKey) return unauthorized(res);

    const { customerEmail, notificationId } = req.body;

    if (!customerEmail || !notificationId) {
      return res.status(400).json({
        success: false,
        error: {
          code: "BAD_REQUEST",
          message: "customerEmail and notificationId are required.",
        },
      });
    }

    const [updatedCount] = await Notification.update(
      { isRead: true },
      {
        where: {
          id: notificationId,
          customerEmail,
        },
      },
    );

    if (!updatedCount) {
      return res.status(404).json({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Notification not found.",
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        message: "Notification marked as read.",
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

export const markAllAsRead = async (
  req: ApiKeyRequest,
  res: Response<ApiResponse>,
) => {
  try {
    if (!req.apiKey) return unauthorized(res);

    const { customerEmail } = req.body;

    if (!customerEmail) {
      return res.status(400).json({
        success: false,
        error: {
          code: "BAD_REQUEST",
          message: "customerEmail is required.",
        },
      });
    }

    const [updatedCount] = await Notification.update(
      { isRead: true },
      {
        where: {
          customerEmail,
          isRead: false,
        },
      },
    );

    return res.status(200).json({
      success: true,
      data: {
        message: `${updatedCount} notifications marked as read.`,
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

    // FIX: Scope deletion to the owner, unless the user is an admin
    const existingNotification = await Notification.findOne({
      where: {
        id: notificationId,
        ...(req.user.role !== "admin" ? { createdBy: req.user.id } : {}),
      },
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
    // Get pagination params
    const { page, limit, offset } = getPaginationParams(req.query);
    const { queue, state, search } = req.query;

    if (!queue)
      return res.status(400).json({
        success: false,
        error: {
          code: "NO_QUEUE_SPECIFIED",
          message: "Specify a queue to request data.",
        },
      });

    const where = {
      // Admins can see all notifications; non-admins only see their own
      ...(req.user.role !== "admin" ? { createdBy: id } : {}),
      channel: queue as string,
      // If state is provided and not "all", filter by status; otherwise, return all states
      ...(state && state !== "all" ? { status: state as string } : {}),
      // If search is provided, filter by customerEmail or displayId containing the search term; otherwise, return all
      ...(search
        ? {
            [Op.or]: [
              { customerEmail: { [Op.like]: `%${search}%` } },
              { displayId: { [Op.like]: `%${search}%` } },
            ],
          }
        : {}),
    };

    const { rows: notifications, count } = await Notification.findAndCountAll({
      where,
      order: [["createdAt", "DESC"]],
      limit: limit,
      offset: offset,
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

    return res
      .status(200)
      .json(
        buildPaginatedResponse(notifications, count, { page, limit, offset }),
      );
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

    // FIX: Admins can look up any notification; non-admins are scoped to their own
    const notification = await Notification.findOne({
      where: {
        id: notificationId,
        ...(req.user.role !== "admin" ? { createdBy: userId } : {}),
      },
      include: [
        {
          model: EmailNotificationDetail,
          as: "emailDetail",
        },
        {
          model: UploadedFile,
          as: "files",
          attributes: ["id", "originalName", "path", "mimeType", "source"],
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
