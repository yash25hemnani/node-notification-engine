import { Router } from "express";
import {
  createInternalSubscription,
  createSubscription,
  getInternalUserSubscription,
  getUserSubscription,
  removeInternalSubscription,
  removeSubscription,
} from "../controllers/subscription.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { apiKeysMiddleware } from "../middleware/keys.middleware";

const router = Router();

router.get("/", apiKeysMiddleware, getUserSubscription)
router.post("/subscribe", apiKeysMiddleware, createSubscription);
router.post("/unsubscribe", apiKeysMiddleware, removeSubscription);

router.get("/internal", authMiddleware, getInternalUserSubscription);
router.post("/internal-subscribe", authMiddleware, createInternalSubscription);
router.delete("/internal-unsubscribe", authMiddleware, removeInternalSubscription);

export default router;
