import { Router } from "express";
import { adminMiddleware } from "../middleware/admin.middleware";
import {
  getAllSubscriptions,
  deleteSubscription,
} from "../controllers/admin.controller";

const router = Router()

router.get("/subscriptions", adminMiddleware, getAllSubscriptions)
router.delete("/subscriptions/:subscriptionId", adminMiddleware, deleteSubscription)

export default router;