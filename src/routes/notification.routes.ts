import { Router } from "express";
import {
  createEmailNotification,
  createPushNotification,
  deleteNotification,
  getQueueNotifications,
  sendTestEmailNotification,
  sendTestPushNotification,
} from "../controllers/notification.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { apiKeysMiddleware } from "../middleware/keys.middleware";
import { prodDeleteGuardMiddleware } from "../middleware/prod.middleware";
import { validate } from "../middleware/validate.middleware";
import {
  notifyEmailSchema,
  notifyPushSchema ,
  testEmailSchema,
  testPushSchema,
} from "../schemas/notification.schema";
import { testNotificationSchema } from "../schemas/testNotification.schema";

const router = Router();

/**
 * Route to create a notification and send based on channels.
 * Requires user_id and api_key to move forward
 * */
router.post(
  "/notify/email",
  validate(notifyEmailSchema),
  apiKeysMiddleware,
  createEmailNotification,
);

router.post(
  "/notify/push",
  validate(notifyPushSchema),
  apiKeysMiddleware,
  createPushNotification,
);

router.post(
  "/test/email",
  authMiddleware,
  validate(testEmailSchema),
  sendTestEmailNotification,
);

router.post(
  "/test/push",
  authMiddleware,
  validate(testPushSchema),
  sendTestPushNotification,
);

router.delete(
  "/:notificationId",
  authMiddleware,
  prodDeleteGuardMiddleware,
  deleteNotification,
);

router.get("/queue/jobs", authMiddleware, getQueueNotifications);

export default router;
