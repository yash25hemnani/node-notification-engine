import { Router } from "express";
import {
    createNotification,
    sendTestNotification,
    
} from "../controllers/notification.controller";
import { apiKeysMiddleware } from "../middleware/keys.middleware";
import { validate } from "../middleware/validate.middleware";
import { notifySchema } from "../schemas/notification.schema";
import { testNotificationSchema } from "../schemas/testNotification.schema";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

/**
 * Route to create a notification and send based on channels.
 * Requires user_id and api_key to move forward
 * */
router.post(
  "/notify",
  validate(notifySchema),
  apiKeysMiddleware,
  createNotification,
);

router.post(
  "/test",
  authMiddleware,
  validate(testNotificationSchema),
  sendTestNotification,
);

export default router;
