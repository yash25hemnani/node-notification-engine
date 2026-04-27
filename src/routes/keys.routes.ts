import { Router } from "express";
import { deleteApiKey, generateApiKey, getApiKey, rotateApiKey } from "../controllers/keys.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.get("/", authMiddleware, getApiKey)
router.post("/generate", authMiddleware, generateApiKey);
router.post("/rotate", authMiddleware, rotateApiKey);
router.delete("/:id", authMiddleware, deleteApiKey);

export default router;
