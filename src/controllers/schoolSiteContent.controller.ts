import type { NextFunction, Request, Response } from "express";
import type { IUserDocument } from "../models/User.model.js";
import {
  createSchoolSiteContent,
  deleteSchoolSiteContent,
  getAdminSchoolSiteContent,
  getPublicSchoolSiteContent,
  updateSchoolSiteContent,
} from "../services/schoolSiteContent.service.js";
import {
  schoolSiteListQuerySchema,
  schoolSiteSectionSchema,
} from "../validators/schoolSiteContent.validator.js";
import ApiError from "../utils/ApiError.js";

const getRequestUser = (req: Request): IUserDocument => {
  if (!req.user) throw new ApiError(401, "Unauthorized.");
  return req.user;
};

export const listPublicSchoolSiteContent = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const parsedSection = schoolSiteSectionSchema.safeParse(req.params.section);
    if (!parsedSection.success) {
      res.status(404).json({ success: false, message: "School content section not found." });
      return;
    }
    const parsedQuery = schoolSiteListQuerySchema.safeParse({
      page: req.query.page,
      limit: req.query.limit,
    });
    if (!parsedQuery.success) {
      res.status(400).json({
        success: false,
        message: "Invalid pagination parameters.",
        errors: parsedQuery.error.issues.map((issue) => issue.message),
      });
      return;
    }

    const data = await getPublicSchoolSiteContent(
      parsedSection.data,
      parsedQuery.data.page,
      parsedQuery.data.limit,
    );
    res.status(200).json({
      success: true,
      data,
      message: "School site content fetched successfully.",
    });
  } catch (error) {
    next(error);
  }
};

export const listAdminSchoolSiteContent = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const parsed = schoolSiteListQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: "Invalid school content filters.",
        errors: parsed.error.issues.map((issue) => issue.message),
      });
      return;
    }
    const data = await getAdminSchoolSiteContent({
      ...(parsed.data.section ? { section: parsed.data.section } : {}),
      ...(parsed.data.status ? { status: parsed.data.status } : {}),
      page: parsed.data.page,
      limit: parsed.data.limit,
    });
    res.status(200).json({
      success: true,
      data,
      message: "School site content fetched successfully.",
    });
  } catch (error) {
    next(error);
  }
};

export const createAdminSchoolSiteContent = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const content = await createSchoolSiteContent(req.body, getRequestUser(req));
    res.status(201).json({
      success: true,
      data: content,
      message: "School site content created successfully.",
    });
  } catch (error) {
    next(error);
  }
};

export const updateAdminSchoolSiteContent = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = req.params.id;
    if (!id || Array.isArray(id)) throw new ApiError(400, "Content ID is required.");
    const content = await updateSchoolSiteContent(id, req.body, getRequestUser(req));
    res.status(200).json({
      success: true,
      data: content,
      message: "School site content updated successfully.",
    });
  } catch (error) {
    next(error);
  }
};

export const deleteAdminSchoolSiteContent = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = req.params.id;
    if (!id || Array.isArray(id)) throw new ApiError(400, "Content ID is required.");
    await deleteSchoolSiteContent(id);
    res.status(200).json({
      success: true,
      data: null,
      message: "School site content deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
};
