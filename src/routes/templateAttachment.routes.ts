import { Router } from "express";
import {
  addTemplateAttachment,
  deleteTemplateAttachment,
  getTemplateAttachments,
} from "../controllers/templateAttachment.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router({ mergeParams: true });

// Attachment Routes
router.get("/", authMiddleware, getTemplateAttachments);
router.post("/", authMiddleware, addTemplateAttachment);
router.delete("/:attachmentId", authMiddleware, deleteTemplateAttachment);

export default router;
