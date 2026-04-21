import { Request, Response } from "express";
import { BrowserSubscription } from "../db/models";

export const createSubscription = async (req: Request, res: Response) => {
  try {
    const { endpoint, keys } = req.body;

    if (!endpoint || !keys) {
      return res.status(400).json({
        success: false,
        message: "endpoint and keys are required",
      });
    }

    const existing = await BrowserSubscription.findOne({
      where: { endpoint },
    });

    if (!existing) {
      await BrowserSubscription.create({
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