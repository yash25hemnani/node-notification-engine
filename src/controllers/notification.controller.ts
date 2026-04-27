// controllers/notification.controller.ts
import { Request, Response } from "express";
import {
  ApiKey,
  BrowserSubscription,
  Notification,
  Template,
} from "../db/models";
import { enqueueNotification } from "../queue/jobs/notification.job";
import crypto from "crypto";
import { logger } from "../utils/logger";

export const createNotification = async (req: Request, res: Response) => {
  try {
    const { channel, user_id, user_email, templateSlug, data } = req.body;

    const idempotencyKey = req.header("Idempotency-Key");

    // Check idempotency
    if (idempotencyKey) {
      const existing = await Notification.findOne({
        where: { idempotency_key: idempotencyKey },
      });

      if (existing) {
        return res.json({
          message: "Already processed",
          id: existing.id,
        });
      }
    }

    let recipient;
    // If channel is push, then fetch recipient
    if (channel === "push") {
      const existingEndpoint = await BrowserSubscription.findOne({
        where: { user_id },
      });

      if (!existingEndpoint) {
        throw new Error("Customer not subscribed.");
      }

      recipient = existingEndpoint.endpoint;
    } else {
      recipient = user_email;
    }

    // Create notification
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

    // Push to queue
    await enqueueNotification({
      notificationId: notification.id,
    });

    // Respond
    return res.json({
      message: "Notification queued",
      id: notification.id,
    });
  } catch (error) {
    logger.error(error);
    console.error("Error creating notification:", error);

    return res.status(500).json({
      message: "Failed to queue notification",
    });
  }
};

