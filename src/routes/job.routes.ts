import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { getJobDetails } from "../controllers/job.controller";

const router = Router()

router.get("/:channel/:jobId", authMiddleware, getJobDetails)

export default router