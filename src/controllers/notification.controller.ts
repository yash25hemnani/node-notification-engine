import { Request, Response } from "express";
import {
  BrowserSubscription,
  Notification,
  Template,
  User,
} from "../db/models";
import { enqueueNotification } from "../queue/jobs/notification.job";
import { logger } from "../utils/logger";
import { ApiResponse, AuthRequest } from "../types/api";

export const createNotification = async (req: Request, res: Response) => {
  try {
    const { channel, user_id, user_email, templateSlug, data } = req.body;

    const idempotencyKey = req.header("Idempotency-Key");

    if (idempotencyKey) {
      const existing = await Notification.findOne({
        where: { idempotency_key: idempotencyKey },
      });

      if (existing) {
        return res.status(200).json({
          success: true,
          data: {
            message: "Already processed",
            id: existing.id,
          },
        });
      }
    }

    let recipient;

    if (channel === "push") {
      const existingEndpoint = await BrowserSubscription.findOne({
        where: { user_id },
      });

      if (!existingEndpoint)
        return res.status(404).json({
          success: false,
          error: {
            code: "SUBSCRIPTION_NOT_FOUND",
            message: "Customer not subscribed.",
          },
        });

      recipient = existingEndpoint.endpoint;
    } else {
      recipient = user_email;
    }

    const notification = await Notification.create({
      channel,
      user_id,
      user_email,
      recipient,
      template_slug: templateSlug,
      data,
      status: "queued",
      idempotency_key: idempotencyKey || null,
    });

    logger.info("Notification created");

    await enqueueNotification({ notificationId: notification.id }, channel); // ← channel passed

    return res.status(201).json({
      success: true,
      data: {
        message: "Notification queued",
        id: notification.id,
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

export const sendTestNotification = async (
  req: AuthRequest,
  res: Response<ApiResponse>,
) => {
  try {
    if (!req.user)
      return res.status(403).json({
        success: false,
        error: {
          code: "AUTHENTICATION_FAILED",
          message: "User not authenticated.",
        },
      });

    const { id } = req.user;

    if (!id)
      return res.status(403).json({
        success: false,
        error: {
          code: "USER_NOT_AUTHENTICATED",
          message: "User not logged in.",
        },
      });

    const user = await User.findOne({ where: { id } });

    if (!user)
      return res.status(404).json({
        success: false,
        error: {
          code: "USER_NOT_FOUND",
          message: "User not found.",
        },
      });

    const { channel, templateSlug, data } = req.body;

    const template = await Template.findOne({
      where: { slug: templateSlug, channel },
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
        where: { idempotency_key: idempotencyKey },
      });

      if (existing) {
        return res.status(200).json({
          success: true,
          data: {
            message: "Already processed",
            id: existing.id,
          },
        });
      }
    }

    let recipient;

    if (channel === "push") {
      const existingEndpoint = await BrowserSubscription.findOne({
        where: { user_id: id },
      });

      if (!existingEndpoint)
        return res.status(404).json({
          success: false,
          error: {
            code: "SUBSCRIPTION_NOT_FOUND",
            message: "User is not subscribed to push notifications.",
          },
        });

      recipient = existingEndpoint.endpoint;
    } else {
      recipient = user.email;
    }

    const notification = await Notification.create({
      channel,
      user_id: id,
      user_email: user.email,
      recipient,
      template_slug: templateSlug,
      data,
      status: "queued",
      idempotency_key: idempotencyKey || null,
    });

    logger.info("Notification created");

    await enqueueNotification({ notificationId: notification.id }, channel); // ← channel passed

    return res.status(201).json({
      success: true,
      data: {
        message: "Notification queued",
        id: notification.id,
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