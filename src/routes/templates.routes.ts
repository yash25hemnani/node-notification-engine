import { Router } from "express";
import {
  createTemplate,
  deleteTemplate,
  getAllTemplates,
  getTemplateById,
  patchTemplate
} from "../controllers/templates.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { createTemplateSchema } from "../schemas/createTemplate.schema";
import { patchTemplateSchema } from "../schemas/patchTemplate.schema";

const router = Router({ mergeParams: true }) 

router.get("/", authMiddleware, getAllTemplates);

router.post(
  "/create",
  authMiddleware,
  validate(createTemplateSchema),
  createTemplate,
);

// Template routes
router.delete("/:id", authMiddleware, deleteTemplate)
router.get("/:id", authMiddleware, getTemplateById);
router.patch("/:id", authMiddleware, validate(patchTemplateSchema), patchTemplate)

export default router;
