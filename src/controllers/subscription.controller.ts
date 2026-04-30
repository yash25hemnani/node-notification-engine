import { Request, Response } from "express";
import { BrowserSubscription, User } from "../db/models";
import { ApiResponse, AuthRequest } from "../types/api";
import { logger } from "../utils/logger";
import { unauthorized } from "../utils/api";

export const createSubscription = async (req: Request, res: Response) => {
  try {
    const { customerId, customerEmail, endpoint, keys } = req.body;

    if (!endpoint || !keys || !customerId) {
      return res.status(400).json({
        success: false,
        message: "userId, endpoint and keys are required",
      });
    }

    const existing = await BrowserSubscription.findOne({
      where: {
        endpoint,
        customerId,
      },
    });

    if (!existing) {
      await BrowserSubscription.create({
        customerId,
        customerEmail,
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

export const createInternalSubscription = async (
  req: AuthRequest,
  res: Response<ApiResponse>,
) => {
  try {
    if (!req.user) return unauthorized(res)

    const { id } = req.user;

    if (!id) {
      return res.status(403).json({
        success: false,
        error: {
          code: "USER_NOT_AUTHENTICATED",
          message: "User not logged in.",
        },
      });
    }

    const user = await User.findOne({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: "USER_NOT_FOUND",
          message: "User not found.",
        },
      });
    }

    const { subscription } = req.body;

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_SUBSCRIPTION_PAYLOAD",
          message: "Valid subscription object is required.",
        },
      });
    }

    const { endpoint, keys } = subscription;

    const existing = await BrowserSubscription.findOne({
      where: {
        endpoint,
        customer_id: id,
      },
    });

    if (!existing) {
      await BrowserSubscription.create({
      customerId: id,
      customerEmail: user.email,
        keys,
      });

      logger.info("Browser subscription created");
    }

    return res.status(200).json({
      success: true,
      data: {
        message: existing
          ? "Subscription already exists"
          : "Subscription created successfully",
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Internal server error occurred.",
      },
    });
  }
};

export const getUserSubscription = async (
  req: AuthRequest,
  res: Response<ApiResponse>,
) => {
  try {
    if (!req.user) {
      return res.status(403).json({
        success: false,
        error: {
          code: "AUTHENTICATION_FAILED",
          message: "User not authenticated.",
        },
      });
    }

    const { id } = req.user;

    if (!id) {
      return res.status(403).json({
        success: false,
        error: {
          code: "USER_NOT_AUTHENTICATED",
          message: "User not logged in.",
        },
      });
    }

    const user = await User.findOne({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: "USER_NOT_FOUND",
          message: "User not found.",
        },
      });
    }

    const subscriptions = await BrowserSubscription.findAll({
      where: {
        customer_id: id,
      },
    });

    return res.status(200).json({
      success: true,
      data: {
        subscriptions,
        count: subscriptions.length,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Internal server error occurred.",
      },
    });
  }
};
