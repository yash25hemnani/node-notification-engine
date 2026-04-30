import { Request, Response } from "express";
import {
  BrowserSubscription,
  Notification,
  Template,
  User,
} from "../db/models";
import { enqueueNotification } from "../queue/jobs/notification.job";
import { logger } from "../utils/logger";
import { ApiKeyRequest, ApiResponse, AuthRequest } from "../types/api";
import { unauthorized } from "../utils/api";

export const createNotification = async (
  req: ApiKeyRequest,
  res: Response<ApiResponse>,
) => {
  try {
    if (!req.apiKey) return unauthorized(res);

    const { user_id: internalUserId } = req.apiKey;
    console.log(req.apiKey)

    const { channel, customer_id, customer_email, templateSlug, data } =
      req.body;

    // Check if requested template slug belongs to the user
    const template = await Template.findOne({
      where: {
        slug: templateSlug,
        user_id: internalUserId,
        channel,
      },
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
        where: { customer_id },
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
      recipient = customer_email;
    }

    const notification = await Notification.create({
      channel,
      customer_id,
      customer_email,
      recipient,
      template_slug: templateSlug,
      data,
      status: "queued",
      idempotency_key: idempotencyKey || null,
      created_by: internalUserId
    });

    logger.info("Notification created");

    await enqueueNotification(
      { notificationId: notification.id, internalUser: { internalUserId } },
      channel,
    ); // ← channel passed

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
      where: { slug: templateSlug, channel, user_id: user.id },
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
        where: { customer_id: id },
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
      customer_id: id,
      customer_email: user.email,
      recipient,
      template_slug: templateSlug,
      data,
      status: "queued",
      idempotency_key: idempotencyKey || null,
      created_by: id
    });

    logger.info("Notification created");

    await enqueueNotification(
      {
        notificationId: notification.id,
        internalUser: { internalUserId: user.id },
      },
      channel,
    );

    console.log(user.id)

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
