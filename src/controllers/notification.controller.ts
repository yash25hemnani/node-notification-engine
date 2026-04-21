// controllers/notification.controller.ts
import { Request, Response } from "express";
import { ApiKey, Notification, Template } from "../db/models";
import { enqueueNotification } from "../queue/jobs/notification.job";
import crypto from "crypto";
import { logger } from "../utils/logger";

export const createTestKey = async (req: Request, res: Response) => {
  try {
    const rawKey = "my-secret-key";

    const hash = crypto.createHash("sha256").update(rawKey).digest("hex");

    await ApiKey.create({
      name: "test",
      key_hash: hash,
      scopes: ["email", "push"],
    });

    console.log("Use this key:", rawKey);

    return res.json({
      message: "API key created",
      key: rawKey,
    });
  } catch (error: any) {
    console.error("API KEY ERROR:", error?.parent || error);

    return res.status(500).json({
      message: "Failed to create API key",
      error: error.message,
    });
  }
};

export const createTemplate = async (req: Request, res: Response) => {
  try {
    const template = await Template.create({
      slug: "welcome",
      channel: "push",
      subject: "Welcome {{name}}",
      body: "Hello {{name}}, welcome to our system!"
    })

    if (template) {
      return res.json({
        message: "Template created.",
      })
    }
  } catch (error) {
    logger.error(error);
    console.error("Error creating template:", error);

    return res.status(500).json({
      message: "Failed to create template",
    });
  }
};

export const createNotification = async (req: Request, res: Response) => {
  try {
    const { channel, recipient, templateSlug, data } = req.body;

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

    // Create notification
    const notification = await Notification.create({
      channel,
      recipient,
      template_slug: templateSlug,
      data,
      status: "queued",
      idempotency_key: idempotencyKey || null,
    });
    
    logger.info("Notification created")
    
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
