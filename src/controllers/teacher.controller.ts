import type { Request, Response, NextFunction } from "express";
import {
  createTeacherService,
  getAllTeachersService,
  getTeacherByIdService,
  updateTeacherService,
  deleteTeacherService,
  getTeacherClassStudentsService,
  getTeacherDashboardService,
} from "../services/teacher.service.js";
import ApiError from "../utils/ApiError.js";
import type { SchoolReadScope } from "../types/schoolReadScope.js";

export const createTeacher = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) throw new ApiError(401, "Unauthorized");
    const teacher = await createTeacherService(req.body, req.user);
    res.status(201).json({
      success: true,
      data: teacher,
      message: "Teacher created successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const getAllTeachers = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const scope = req.schoolReadScope;
    if (!scope) throw new ApiError(500, "School read scope not initialized");

    const { status, search, page, limit } = req.query;

    const filters: {
      status?: string;
      search?: string;
      page?: number;
      limit?: number;
    } = {};

    if (status) filters.status = status as string;
    if (search) filters.search = search as string;
    if (page) filters.page = Number(page);
    if (limit) filters.limit = Number(limit);

    const result = await getAllTeachersService(filters, scope);
    res.status(200).json({
      success: true,
      data: result,
      message: "Teachers fetched successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const getTeacherById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const scope = req.schoolReadScope;
    if (!scope) throw new ApiError(500, "School read scope not initialized");

    const { id } = req.params;
    if (!id || Array.isArray(id)) {
      res.status(400).json({ success: false, message: "Teacher ID is required" });
      return;
    }
    const teacher = await getTeacherByIdService(id, scope);
    res.status(200).json({
      success: true,
      data: teacher,
      message: "Teacher fetched successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const updateTeacher = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    if (!id || Array.isArray(id)) {
      res.status(400).json({ success: false, message: "Teacher ID is required" });
      return;
    }
    if (!req.user) throw new ApiError(401, "Unauthorized");
    const teacher = await updateTeacherService(id, req.body, req.user);
    res.status(200).json({
      success: true,
      data: teacher,
      message: "Teacher updated successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const deleteTeacher = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    if (!id || Array.isArray(id)) {
      res.status(400).json({ success: false, message: "Teacher ID is required" });
      return;
    }
    if (!req.user) throw new ApiError(401, "Unauthorized");
    await deleteTeacherService(id, req.user);
    res.status(200).json({
      success: true,
      data: null,
      message: "Teacher deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const getTeacherClassStudents = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const scope = req.schoolReadScope;
    if (!scope) throw new ApiError(500, "School read scope not initialized");

    // Get id from params - could be "me" or an actual teacher ID
    const { id } = req.params;
    
    // If no id param (route is /me/class-students), use "me"
    // If id is provided, use it (could be "me" or actual ID)
    const teacherId = (Array.isArray(id) ? id[0] : id) || "me";

    const result = await getTeacherClassStudentsService(teacherId, scope as SchoolReadScope);
    res.status(200).json({
      success: true,
      data: result,
      message: "Class students fetched successfully",
    });
  } catch (error) {
    next(error);
  }
};


export const getTeacherDashboard = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const scope = req.schoolReadScope;
    if (!scope) throw new ApiError(500, "School read scope not initialized");

    const dashboard = await getTeacherDashboardService(scope);
    res.status(200).json({
      success: true,
      data: dashboard,
      message: "Dashboard data fetched successfully",
    });
  } catch (error) {
    next(error);
  }
};
