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

    const { userId: internalUserId } = req.apiKey;
    console.log(req.apiKey);

    const { channel, customerId, customerEmail, templateSlug, data } = req.body;

    // Check if requested template slug belongs to the user
    const template = await Template.findOne({
      where: {
        slug: templateSlug,
        userId: internalUserId,
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
        where: { idempotencyKey: idempotencyKey },
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
            channel,
            customerId,
            customerEmail,
            recipient: sub.endpoint, 
            templateSlug,
            data,
            status: "waiting",
            idempotencyKey: idempotencyKey || null,
            createdBy: internalUserId,
          }),
        ),
      );

      await Promise.all(
        notifications.map((notification) =>
          enqueueNotification(
            {
              notificationId: notification.id,
              internalUser: { internalUserId },
            },
            channel,
          ),
        ),
      );

      return res.status(201).json({
        success: true,
        data: {
          message: "Notifications queued",
          ids: notifications.map((n) => n.id),
        },
      });
    } else {
      recipient = customerEmail;
    }

    const notification = await Notification.create({
      channel,
      customerId,
      customerEmail,
      recipient,
      templateSlug: templateSlug,
      data,
      status: "waiting",
      idempotencyKey: idempotencyKey || null,
      createdBy: internalUserId,
    });

    logger.info("Notification created");

    await enqueueNotification(
      { notificationId: notification.id, internalUser: { internalUserId } },
      channel,
    );

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
      where: { slug: templateSlug, channel, userId: user.id },
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
        where: { idempotencyKey: idempotencyKey },
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
        where: { customerId: id },
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
      customerId: id,
      customerEmail: user.email,
      recipient,
      templateSlug: templateSlug,
      data,
      status: "waiting",
      idempotencyKey: idempotencyKey || null,
      createdBy: id,
    });

    logger.info("Notification created");

    await enqueueNotification(
      {
        notificationId: notification.id,
        internalUser: { internalUserId: user.id },
      },
      channel,
    );

    console.log(user.id);

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

// Delete a notification from the table as well as the queue
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
        error: {
          code: "BAD_REQUST",
          message: "Notification ID not provided",
        },
      });

    const existingNotification = await Notification.findOne({
      where: { id: notificationId },
    });

    if (!existingNotification)
      return res.status(404).json({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Notification not found",
        },
      });

    await existingNotification.destroy();

    return res.status(200).json({
      success: true,
      data: {
        id: notificationId,
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Unknown error occured.",
      },
    });
  }
};

// Getting jobs for a queue
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
    console.log(error);
    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Unknown error occured.",
      },
    });
  }
};
