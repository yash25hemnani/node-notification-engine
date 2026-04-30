import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { dashboardStream, getQueueJobs } from "../controllers/dashboard.controller";

const router = Router()

router.get("/stream", authMiddleware, dashboardStream)
router.get("/queue/jobs", authMiddleware, getQueueJobs);

export default router;
