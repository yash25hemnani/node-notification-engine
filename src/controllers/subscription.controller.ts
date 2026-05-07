import { Request, Response } from "express";
import { BrowserSubscription, User } from "../db/models";
import { ApiKeyRequest, ApiResponse, AuthRequest } from "../types/api";
import { logger } from "../utils/logger";
import { unauthorized } from "../utils/api";

export const getUserSubscription = async (
  req: ApiKeyRequest,
  res: Response<ApiResponse>,
) => {
  try {
    if (!req.apiKey) return unauthorized(res);

    const { endpoint } = req.query;

    const subscription = await BrowserSubscription.findOne({
      where: {
        endpoint,
      },
    });

    return res.status(200).json({
      success: true,
      data: {
        subscription,
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Internal server error occurred.",
      },
    });
  }
};

export const createSubscription = async (
  req: ApiKeyRequest,
  res: Response<ApiResponse>,
) => {
  try {
    if (!req.apiKey) return unauthorized(res);

    const { customerId, customerEmail, subscription } = req.body;

    if (
      !subscription ||
      !subscription.endpoint ||
      !subscription.keys ||
      !customerId ||
      !customerEmail
    ) {
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

    return res.status(200).json({
      success: true,
      data: {
        message: existing
          ? "Subscription already exists"
          : "Subscription created successfully",
      },
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Internal server error occurred.",
      },
    });
  }
};

export const removeSubscription = async (
  req: ApiKeyRequest,
  res: Response<ApiResponse>,
) => {
  try {
    if (!req.apiKey) return unauthorized(res);

    const { endpoint } = req.body;

    if (!endpoint) {
      return res.status(400).json({
        success: false,
        error: {
          code: "MISSING_ENDPOINT",
          message: "Endpoint is required.",
        },
      });
    }

    const subscription = await BrowserSubscription.findOne({
      where: {
        endpoint,
      },
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        error: {
          code: "SUBSCRIPTION_NOT_FOUND",
          message: "Subscription not found.",
        },
      });
    }

    await subscription.destroy();

    logger.info("Browser subscription removed");

    return res.status(200).json({
      success: true,
      data: {
        message: "Subscription removed successfully",
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

export const createInternalSubscription = async (
  req: AuthRequest,
  res: Response<ApiResponse>,
) => {
  try {
    if (!req.user) return unauthorized(res);

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
        customerId: id,
      },
    });

    if (!existing) {
      await BrowserSubscription.create({
        customerId: id,
        customerEmail: user.email,
        keys,
        endpoint,
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

export const removeInternalSubscription = async (
  req: AuthRequest,
  res: Response<ApiResponse>,
) => {
  try {
    if (!req.user) return unauthorized(res);

    const { id } = req.user;

    const { endpoint } = req.body;

    if (!endpoint) {
      return res.status(400).json({
        success: false,
        error: {
          code: "MISSING_ENDPOINT",
          message: "Endpoint is required.",
        },
      });
    }

    const subscription = await BrowserSubscription.findOne({
      where: {
        endpoint,
        customerId: id,
      },
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        error: {
          code: "SUBSCRIPTION_NOT_FOUND",
          message: "Subscription not found.",
        },
      });
    }

    await subscription.destroy();

    logger.info("Browser subscription removed");

    return res.status(200).json({
      success: true,
      data: {
        message: "Subscription removed successfully",
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

export const getInternalUserSubscription = async (
  req: AuthRequest,
  res: Response<ApiResponse>,
) => {
  try {
    if (!req.user) return unauthorized(res);

    const { id } = req.user;

    const { endpoint } = req.query;

    if (!endpoint) {
      return res.status(200).json({
        success: false,
        error: {
          code: "NO_SUBSCRIPTION_EXISTS",
          message: "Create a new subscription",
        },
      });
    }

    const subscription = await BrowserSubscription.findOne({
      where: {
        customerId: id,
        endpoint,
      },
    });

    if (!subscription) {
      return res.status(200).json({
        success: false,
        error: {
          code: "NO_SUBSCRIPTION_EXISTS",
          message: "Create a new subscription",
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        subscription,
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Internal server error occurred.",
      },
    });
  }
};
