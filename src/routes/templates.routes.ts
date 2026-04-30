import { Router } from "express";
import { validate } from "../middleware/validate.middleware";
import { createTemplateSchema } from "../schemas/createTemplate.schema";
import { authMiddleware } from "../middleware/auth.middleware";
import {
  createTemplate,
  deleteTemplate,
  getAllTemplates,
  getTemplateById,
  patchTemplate,
} from "../controllers/templates.controller";
import { patchTemplateSchema } from "../schemas/patchTemplate.schema";

const router = Router();

router.get("/", authMiddleware, getAllTemplates);

router.post(
  "/create",
  authMiddleware,
  validate(createTemplateSchema),
  createTemplate,
);

router.delete("/:id", authMiddleware, deleteTemplate)
router.get("/:id", authMiddleware, getTemplateById);
router.patch("/:id", authMiddleware, validate(patchTemplateSchema), patchTemplate)

export default router;
