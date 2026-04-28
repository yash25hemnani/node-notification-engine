import { Router } from "express";
import {
  createInternalSubscription,
  createSubscription,
  getUserSubscription,
} from "../controllers/subscription.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.post("/subscribe", createSubscription);

router.get("/", authMiddleware, getUserSubscription);
router.post("/internal-subscribe", authMiddleware, createInternalSubscription);

export default router;
