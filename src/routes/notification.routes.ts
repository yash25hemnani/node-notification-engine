import { Router } from "express";
import {
  createEmailNotification,
  createPushNotification,
  deleteNotification,
  getQueueNotifications,
  getSingleNotification,
  sendTestEmailNotification,
  sendTestPushNotification,
  uploadEmailAttachments,
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
import { upload } from "../utils/upload";

const router = Router();

/**
 * Route to create an email notification
 *    - For attachments - Accepts File or File Paths
 * */

router.post(
  "/notify/upload-attachments",
  upload.array("files"),
  apiKeysMiddleware,
  uploadEmailAttachments,
);

router.post(
  "/notify/email",
  upload.array("files"),
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
router.get("/:notificationId", authMiddleware, getSingleNotification);

export default router;
