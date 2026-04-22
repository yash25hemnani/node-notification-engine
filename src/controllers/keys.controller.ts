import { ApiKey } from "../db/models";
import { ApiResponse, AuthRequest } from "../types/api";
import { Response, Request } from "express";
import crypto from "crypto";

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
      user_id: id,
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
    user_id: id,
    key_hash: keyHash,
    name: name,
    scopes: [],
    is_revealed: true, // Cnan only view key once
  });

  // Send to user, allow only once
  return res.status(201).json({
    success: true,
    data: {
      id: newApiKey.id,
      name: newApiKey.name,
      api_key: rawKey,
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

  // Check if a key already exists for this user
  const existingApiKey = await ApiKey.findOne({
    where: {
      user_id: id,
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
    user_id: id,
    key_hash: keyHash,
    name: name,
    scopes: [],
    is_revealed: true, // Cnan only view key once
  });

  // Send to user, allow only once
  return res.status(201).json({
    success: true,
    data: {
      id: newApiKey.id,
      name: newApiKey.name,
      api_key: rawKey,
    },
  });
};
