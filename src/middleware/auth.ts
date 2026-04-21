import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { ApiKey } from "../db/models/index";

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // Check if authorization headers are sent 
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ error: "Missing Authorization header" });
    }

    // Get only token after removing "Bearer " from "Bearer <token>"
    const token = authHeader.replace("Bearer ", "");
    
    const hash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    // Check if API Key exists
    const apiKey = await ApiKey.findOne({
      where: { key_hash: hash, is_active: true },
    });

    if (!apiKey) {
      return res.status(401).json({ error: "Invalid API key" });
    }

    // attach for later use
    (req as any).apiKey = apiKey;

    // Send control to next function
    next();
  } catch (err) {
    next(err);
  }
}