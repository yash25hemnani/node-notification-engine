import { Router } from "express";
import { dashboardStream } from "../controllers/dashboard.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router()

router.get("/stream", authMiddleware, dashboardStream)


export default router;
