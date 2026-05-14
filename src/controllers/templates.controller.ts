
import { Template } from "../db/models";
import { ApiResponse, AuthRequest } from "../types/api";
import { Response } from "express";
import { Op } from "sequelize";
import { unauthorized } from "../utils/api";
import { TemplateAttachment } from "../db/models/TemplateAttachment";
import { UploadedFile } from "../db/models/UploadedFile";

export const createTemplate = async (
  req: AuthRequest,
  res: Response<ApiResponse>,
) => {
  try {
    if (!req.user) return unauthorized(res);
    const { id } = req.user;

    const { name, channel } = req.body;

    if (!name || !channel)
      return res.status(400).json({
        success: false,
        error: {
          code: "DATA_MISSING",
          message: "Either name or channel is missing.",
        },
      });

    const slug = name.toLowerCase().split(" ").join("-");

    const isExisting = await Template.findOne({
      where: { slug, channel, userId: id },
    });

    if (isExisting)
      return res.status(400).json({
        success: false,
        error: {
          code: "SLUG_ALREADY_EXISTS",
          message: "Given slug already exists.",
        },
      });

    const newTemplate = await Template.create({
      name,
      slug,
      channel,
      userId: id,
    });

    return res.status(201).json({
      success: true,
      data: { template: newTemplate },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Internal server error occurred.",
      },
    });
  }
};

export const patchTemplate = async (
  req: AuthRequest,
  res: Response<ApiResponse>,
) => {
  try {
    if (!req.user) return unauthorized(res);
    const { id: userId } = req.user;

    const { id } = req.params;
    const { subject, body } = req.body;

    if (!subject && !body)
      return res.status(400).json({
        success: false,
        error: {
          code: "DATA_MISSING",
          message: "Either subject or body is required.",
        },
      });

    const template = await Template.findOne({
      where: { id, userId }, 
    });

    if (!template)
      return res.status(404).json({
        success: false,
        error: {
          code: "TEMPLATE_NOT_FOUND",
          message: "Template not found.",
        },
      });

    await template.update({
      ...(subject && { subject }),
      ...(body && { body }),
    });

    return res.status(200).json({
      success: true,
      data: { template },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Internal server error occurred.",
      },
    });
  }
};

export const getAllTemplates = async (
  req: AuthRequest,
  res: Response<ApiResponse>,
) => {
  try {
    if (!req.user) return unauthorized(res);
    const { id: userId } = req.user;

    const { channel, search } = req.query;

    const allTemplates = await Template.findAll({
      where: {
        userId, // ← only their templates
        ...(channel ? { channel: channel as string } : {}),
        ...(search ? {
          name: { [Op.iLike]: `%${search as string}%` },
        } : {}),
      },
    });

    return res.status(200).json({
      success: true,
      data: { results: allTemplates },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Internal server error occurred.",
      },
    });
  }
};

export const getTemplateById = async (
  req: AuthRequest,
  res: Response<ApiResponse>,
) => {
  try {
    if (!req.user) return unauthorized(res);
    const { id: userId } = req.user;

    const { id } = req.params;

    const template = await Template.findOne({
      where: { id, userId }, 
    });

    if (!template)
      return res.status(404).json({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Template not found.",
        },
      });

    return res.status(200).json({
      success: true,
      data: template,
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

export const deleteTemplate = async (
  req: AuthRequest,
  res: Response<ApiResponse>,
) => {
  try {
    if (!req.user) return unauthorized(res);
    const { id: userId } = req.user;

    const { id } = req.params;

    const template = await Template.findOne({
      where: { id, userId }, // ← only their template
    });

    if (!template)
      return res.status(404).json({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Template not found.",
        },
      });

    await template.destroy();

    return res.status(200).json({
      success: true,
      data: null,
    });
  } catch (error) {
    console.log(error)
    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Internal server error.",
      },
    });
  }
};
