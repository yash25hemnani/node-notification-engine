import { logger } from "handlebars";
import { Template } from "../db/models";
import { ApiResponse, AuthRequest } from "../types/api";
import { Response } from "express";

/**
 * Create Template with name, slug and channel.
 * These things will not be allowed to be patched
 */
export const createTemplate = async (
  req: AuthRequest,
  res: Response<ApiResponse>,
) => {
  // Create template with slug and channel only
  try {
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
      where: { slug, channel },
    });

    if (isExisting) {
      return res.status(400).json({
        success: false,
        error: {
          code: "SLUG_ALREADY_EXISTS",
          message: "Given slug aready exists. ",
        },
      });
    }

    const newTemplate = await Template.create({
      name,
      slug,
      channel,
    });

    return res.status(201).json({
      success: true,
      data: {
        template: newTemplate,
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Internal server error occured.",
      },
    });
  }
};

/**
 * Allow patching of only body or subject
 */
export const patchTemplate = async (
  req: AuthRequest,
  res: Response<ApiResponse>,
) => {
  try {
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

    const template = await Template.findOne({ where: { id } });

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
      data: {
        template,
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Internal server error occured.",
      },
    });
  }
};

/**
 * Route to list all templates
 */
export const getAllTemplates = async (
  req: AuthRequest,
  res: Response<ApiResponse>,
) => {
  try {
    const allTemplates = await Template.findAll();

    return res.status(200).json({
      success: true,
      data: {
        results: allTemplates,
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Internal server error occured.",
      },
    });
  }
};

export const getTemplateById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const template = await Template.findOne({ where: { id } });

    if (!template) {
      return res.status(404).json({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Template not found",
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: template,
    });
  } catch (error) {
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
 * Delete a template by ID
 */

export const deleteTemplate = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const template = await Template.findOne({ where: { id } });

    if (!template) {
      return res.status(404).json({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Template not found",
        },
      });
    }

    await template.destroy();

    return res.status(200).json({
      success: true,
      data: null,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Internal server error",
      },
    });
  }
};
