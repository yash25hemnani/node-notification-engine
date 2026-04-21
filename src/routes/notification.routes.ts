import { Router } from "express";
import { createTestKey, createTestNotification } from "../controllers/notification.controller";
import { authMiddleware } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { notifySchema } from "../schemas/notification.schema";

const router = Router();

// Test route for creating notification
router.post("/create-test-key", createTestKey)
router.post("/notify", authMiddleware, validate(notifySchema), createTestNotification);

export default router;