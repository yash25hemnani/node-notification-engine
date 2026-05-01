import { NextFunction, Request, Response } from "express";
import { ApiResponse } from "../types/api";

import crypto from "crypto";
import { ApiKey } from "../db/models";

export async function apiKeysMiddleware(
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction,
) {
  try {
    // Extract the api key
    const apiKey = req.headers["x-api-key"];

    // Error if no apikey found
    if (!apiKey || typeof apiKey !== "string") {
      return res.status(401).json({
        success: false,
        error: {
          code: "MISSING_API_KEY",
          message: "API key is required",
        },
      });
    }
    
    // Hash api key
    // Key is in the form of key_abcd....
    const hashedApiKey = crypto
      .createHash("sha256")
      .update(apiKey.split("_")[1])
      .digest("hex");


    // Find match with user and apikey
    const matchFound = await ApiKey.findOne({
      where: {
        keyHash: `key_${hashedApiKey}`,
        isActive: true,
      },
    });

    if (!matchFound) {
      return res.status(403).json({
        success: false,
        error: {
          code: "INVALID_API_KEY",
          message: "API key is invalid or inactive",
        },
      });
    }

    // Attach API key context to request
    (req as any).apiKey = matchFound;

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: {
        code: "API_KEY_ERROR",
        message: "Failed to validate API key",
      },
    });
  }
}
