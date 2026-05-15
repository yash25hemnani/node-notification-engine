import { ApiResponse, AuthRequest } from "../types/api";
import { Response } from "express";
import { unauthorized } from "../utils/api";
import { BrowserSubscription } from "../db/models";
import { Op, Sequelize } from "sequelize";
import {
  getPaginationParams,
  buildPaginatedResponse,
} from "../utils/pagination";

export const getAllSubscriptions = async (
  req: AuthRequest,
  res: Response<ApiResponse>,
) => {
  try {
    if (!req.user) return unauthorized(res);

    //
    const { search } = req.query;
    const { page, limit, offset } = getPaginationParams(req.query);

    const searchWhere = search
      ? { customerEmail: { [Op.like]: `%${search}%` } }
      : {};

    // Count is returned as an array due to grouping, so we take its length for total count
    const { rows: subscriptions, count } =
      await BrowserSubscription.findAndCountAll({
        where: searchWhere,
        group: ["customerEmail", "customerId"],
        attributes: [
          "customerEmail",
          "customerId",
          [Sequelize.fn("COUNT", Sequelize.col("customerEmail")), "count"],
        ],
        limit,
        offset,
        subQuery: false,
      });

    if (!subscriptions.length)
      return res.status(404).json({
        success: false,
        error: { code: "NO_DATA_FOUND", message: "No data found." },
      });

    // Build paginated response using our utility function
    return res.status(200).json(
      buildPaginatedResponse(subscriptions, count.length, {
        page,
        limit,
        offset,
      }),
    );
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

export const getSingleSubscription = async (
  req: AuthRequest,
  res: Response<ApiResponse>,
) => {
  try {
    if (!req.user) return unauthorized(res);

    const { customerEmail } = req.params;

    const subscriptions = await BrowserSubscription.findAll({
      attributes: ["id", "customerEmail", "customerId", "endpoint"],
      where: { customerEmail },
    });

    if (!subscriptions.length)
      return res.status(404).json({
        success: false,
        error: {
          code: "NO_DATA_FOUND",
          message: "No data found for given email.",
        },
      });

    return res.status(200).json({
      success: true,
      data: {
        count: subscriptions.length,
        subscriptions,
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

    return res.status(200).json({ success: true, data: null });
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
