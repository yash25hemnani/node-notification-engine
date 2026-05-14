import { ApiResponse, AuthRequest } from "../types/api";
import { Response } from "express";
import { unauthorized } from "../utils/api";
import { BrowserSubscription } from "../db/models";
import { Sequelize } from "sequelize";

export const getAllSubscriptions = async (
  req: AuthRequest,
  res: Response<ApiResponse>,
) => {
  try {
    if (!req.user) return unauthorized(res);

    const { customerEmail } = req.query;

    // Group subscriptions by email
    const subscriptions = await BrowserSubscription.findAll({
      group: ["customerEmail", "customerId"],
      attributes: [
        "customerEmail",
        "customerId",
        [Sequelize.fn("COUNT", Sequelize.col("customerEmail")), "count"],
      ],
      where: customerEmail
        ? {
            customerEmail: customerEmail as string,
          }
        : undefined,
    });

    if (!subscriptions.length)
      return res.status(404).json({
        success: false,
        error: {
          code: "NO_DATA_FOUND",
          message: "No data found for given email",
        },
      });

    return res.status(200).json({
      success: true,
      data: {
        // Map through subscriptions and convert count to number
        subscriptions: subscriptions.map((s) => ({
          ...s.toJSON(),
          count: parseInt(s.get("count") as string),
        })),
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Internal server error.",
      },
    });
  }
};

export const deleteSubscription = async (
  req: AuthRequest,
  res: Response<ApiResponse>,
) => {
  try {
    if (!req.user) return unauthorized(res);

    const { subscriptionId } = req.params;
    const subscription = await BrowserSubscription.findByPk(
      subscriptionId as string,
    );

    if (!subscription)
      return res.status(404).json({
        success: false,
        error: {
          code: "SUBSCRIPTION_NOT_FOUND",
          message: "Subscription not found.",
        },
      });

    await subscription.destroy();

    return res.status(200).json({
      success: true,
      data: null,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Internal server error.",
      },
    });
  }
};
