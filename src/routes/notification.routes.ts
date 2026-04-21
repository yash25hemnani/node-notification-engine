import { Router } from "express";
import { createNotification, createTestKey, createTemplate } from "../controllers/notification.controller";
import { authMiddleware } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { notifySchema } from "../schemas/notification.schema";

const router = Router();

// Test route for creating notification
router.post("/create-test-key", createTestKey)
router.post("/create-template", createTemplate)
router.post("/notify", authMiddleware, validate(notifySchema), createNotification);

export default router;