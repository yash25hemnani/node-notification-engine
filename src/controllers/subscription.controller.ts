import { Request, Response } from "express";
import { BrowserSubscription } from "../db/models";

export const createSubscription = async (req: Request, res: Response) => {
  try {
    const { user_id, user_email, endpoint, keys } = req.body;

    if (!endpoint || !keys || !user_id) {
      return res.status(400).json({
        success: false,
        message: "userId, endpoint and keys are required",
      });
    }

    const existing = await BrowserSubscription.findOne({
      where: {
        endpoint,
        user_id,
      },
    });

    if (!existing) {
      await BrowserSubscription.create({
        user_id,
        user_email,
        endpoint,
        keys,
      });
    }

    return res.json({ success: true });
  } catch (err) {
    console.error("Subscription error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const listSubscriptions = async (req: Request, res: Response) => {
  try {
    const subscriptions = await BrowserSubscription.findAll();

    if (subscriptions.length > 0) {
      return res.json({
        data: subscriptions,
        success: true,
      });
    }
  } catch (err) {
    console.error("Couldn't list subscriptions:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
