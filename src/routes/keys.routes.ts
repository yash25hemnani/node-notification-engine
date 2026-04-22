import { Router } from "express";
import { generateApiKey, rotateApiKey } from "../controllers/keys.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.post("/generate", authMiddleware, generateApiKey);
router.post("/rotate", authMiddleware, rotateApiKey);

export default router;
