import crypto from "crypto";
import { Response } from "express";
import { ApiKey } from "../db/models";
import { ApiResponse, AuthRequest } from "../types/api";

/**
 * Get API Key for a user (No more than one key per user)
 */
export const getApiKey = async (
  req: AuthRequest,
  res: Response<ApiResponse>,
) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: {
        code: "UNAUTHORIZED",
        message: "User is not authorized.",
      },
    });
  }

  console.log(req.user);
  const { id } = req.user;
  console.log(id);

  const apiKey = await ApiKey.findOne({
    where: { userId: id },
    attributes: ["id", "name", "scopes", "createdAt"], // ← never return key_hash
  });

  if (!apiKey) {
    return res.status(200).json({
      success: true,
      data: {
        apiKey: null,
      },
    });
  }

  return res.status(200).json({
    success: true,
    data: {
      apiKey,
    },
  });
};

export const generateApiKey = async (
  req: AuthRequest,
  res: Response<ApiResponse>,
) => {
  // Get id from authMiddleware
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: {
        code: "UNAUTHORIZED",
        message: "User is not authorized.",
      },
    });
  }

  const { id } = req.user;

  // Check if a key already exists for this user
  const existingApiKey = await ApiKey.findOne({
    where: {
      userId: id,
    },
  });

  if (existingApiKey) {
    // Ask user to rotate keys if they have lost the api-key
    return res.status(409).json({
      success: false,
      error: {
        code: "API_KEY_ALREADY_EXISTS",
        message: "API key already exists. Please rotate instead.",
      },
    });
  }

  const { name } = req.body;

  // Create ApiKey and hash it
  const rawKey = crypto.randomBytes(32).toString("hex");
  const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");

  // Create a new api key
  const newApiKey = await ApiKey.create({
    userId: id,
    keyHash: `key_${keyHash}`,
    name: name,
    scopes: [],
    isRevealed: true, // Can only view key once
  });

  // Send to user, allow only once
  return res.status(201).json({
    success: true,
    data: {
      id: newApiKey.id,
      name: newApiKey.name,
      apiKey: `key_${rawKey}`,
    },
  });
};

export const rotateApiKey = async (
  req: AuthRequest,
  res: Response<ApiResponse>,
) => {
  // Change keys for a particular user
  // Get id from authMiddleware
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: {
        code: "UNAUTHORIZED",
        message: "User is not authorized.",
      },
    });
  }

  const { id } = req.user;
  console.log(id)

  // Check if a key already exists for this user
  const existingApiKey = await ApiKey.findOne({
    where: {
      userId: id,
    },
  });

  if (!existingApiKey) {
    return res.status(404).json({
      success: false,
      error: {
        code: "KEY_NOT_FOUND",
        message: "Key not found.",
      },
    });
  }

  // Delete old api key
  await ApiKey.destroy({
    where: { id: existingApiKey.id },
  });

  // Create new key and send to user
  const rawKey = crypto.randomBytes(32).toString("hex");
  const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");
  const { name } = req.body;

  // Create a new api key
  const newApiKey = await ApiKey.create({
    userId: id,
    keyHash: `key_${keyHash}`,
    name: name,
    scopes: [],
    isRevealed: true, // Can only view key once
  });

  // Send to user, allow only once
  return res.status(201).json({
    success: true,
    data: {
      id: newApiKey.id,
      name: newApiKey.name,
      apiKey: `key_${rawKey}`,
    },
  });
};

export const deleteApiKey = async (
  req: AuthRequest,
  res: Response<ApiResponse>,
) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: {
        code: "UNAUTHORIZED",
        message: "User is not authorized.",
      },
    });
  }

  const { id } = req.params;

  try {
    const apiKey = await ApiKey.findOne({
      where: { id, userId: req.user.id },
    });

    if (!apiKey) {
      return res.status(404).json({
        success: false,
        error: {
          code: "KEY_NOT_FOUND",
          message: "API key not found.",
        },
      });
    }

    await apiKey.destroy();

    return res.status(200).json({
      success: true,
      data: null,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Internal server error.",
      },
    });
  }
};

