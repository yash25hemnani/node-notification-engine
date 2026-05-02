import { where } from "sequelize";
import { ENV } from "../config/env";
import { Template } from "../db/models";
import { TemplateAttachment } from "../db/models/TemplateAttachment";
import { UploadedFile } from "../db/models/UploadedFile";
import { ApiResponse, AuthRequest } from "../types/api";
import { Response } from "express";
import path from "path";
import fs from "fs/promises"

/**
 * Get all attachments for a template
 */
export const getTemplateAttachments = async (
  req: AuthRequest,
  res: Response<ApiResponse>,
) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: {
        code: "UNAUTHORIZED",
        message: "User is not authorized.",
      },
    });
  }

  const { templateId } = req.params;

  const attachments = await TemplateAttachment.findAll({
    where: { templateId },
    include: [
      {
        model: UploadedFile,
        as: "file",
        attributes: [
          "id",
          "originalName",
          "mimeType",
          "size",
          "path",
          "createdAt",
        ],
      },
    ],
    attributes: ["id", "templateId", "fileId", "createdAt"],
  });

  return res.status(200).json({
    success: true,
    data: { attachments },
  });
};

/**
 * Add an attachment to a template (links an already-uploaded file)
 */
export const addTemplateAttachment = async (
  req: AuthRequest,
  res: Response<ApiResponse>,
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "User is not authorized.",
        },
      });
    }

    console.log(req.params);

    const { templateId } = req.params;

    if (!templateId)
      return res.status(400).json({
        success: true,
        error: {
          code: "ID_NOT_PROVIDED",
          message: "Template ID not provided",
        },
      });

    const existingTemplate = await Template.findOne({
      where: {
        id: templateId,
      },
    });

    if (!existingTemplate)
      return res.status(404).json({
        success: false,
        error: {
          code: "TEMPLATE_NOT_FOUND",
          message: "Template not found",
        },
      });

    if (existingTemplate.channel === "push") {
      return res.status(400).json({
        success: false,
        error: {
          code: "BAD_REQUEST",
          message: "Push doesn't support attachments",
        },
      });
    }

    const { fileId } = req.body;

    const file = await UploadedFile.findOne({
      where: { id: fileId, uploadedBy: req.user.id },
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        error: {
          code: "FILE_NOT_FOUND",
          message: "File not found.",
        },
      });
    }

    const attachment = await TemplateAttachment.create({
      templateId,
      fileId: file.id,
      filename: file.originalName,
      mimeType: file.mimeType,
      size: file.size,
    });

    return res.status(201).json({
      success: true,
      data: { attachment },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Internal server error",
      },
    });
  }
};

/**
 * Remove an attachment from a template
 */
export const deleteTemplateAttachment = async (
  req: AuthRequest,
  res: Response<ApiResponse>,
) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: {
        code: "UNAUTHORIZED",
        message: "User is not authorized.",
      },
    });
  }

  const { templateId, attachmentId } = req.params;

  try {
    const attachment = await TemplateAttachment.findOne({
      where: { id: attachmentId, templateId },
    });

    if (!attachment) {
      return res.status(404).json({
        success: false,
        error: {
          code: "ATTACHMENT_NOT_FOUND",
          message: "Attachment not found.",
        },
      });
    }

    if (ENV.NODE_ENV === "development") {
      const file = await UploadedFile.findOne({
        where: {
          id: attachment.fileId,
        },
      });

      if (!file) return res.status(404).json({
        success: false,
        error: {
          code: "FILE_NOT_FOUND",
          message: "File not found.",
        },
      });
      
      const absolutePath = path.join(__dirname, "../../", file?.path);
      
      await file?.destroy();
      await fs.unlink(absolutePath);
    }

    await attachment.destroy();

    return res.status(200).json({
      success: true,
      data: null,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Internal server error.",
      },
    });
  }
};
