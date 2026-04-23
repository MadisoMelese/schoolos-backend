import type { Request, Response, NextFunction } from "express";
import {
  createStudentService,
  getAllStudentsService,
  getStudentByIdService,
  updateStudentService,
  deleteStudentService,
  getStudentDashboardService,
  syncClassStudentsService,
} from "../services/student.service.js";
import ApiError from "../utils/ApiError.js";

export const createStudent = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) throw new ApiError(401, "Unauthorized");
    const student = await createStudentService(req.body, req.user);
    res
      .status(201)
      .json({
        success: true,
        data: student,
        message: "Student created successfully",
      });
  } catch (error) {
    next(error);
  }
};

export const getAllStudents = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const scope = req.schoolReadScope;
    if (!scope) throw new ApiError(500, "School read scope not initialized");

    const { status, classId, search, page, limit } = req.query;

    const filters: {
      status?: string;
      classId?: string;
      search?: string;
      page?: number;
      limit?: number;
    } = {};

    if (status) filters.status = status as string;
    if (classId) filters.classId = classId as string;
    if (search) filters.search = search as string;
    if (page) filters.page = Number(page);
    if (limit) filters.limit = Number(limit);

    const result = await getAllStudentsService(filters, scope);
    res.status(200).json({
      success: true,
      data: result,
      message: "Students fetched successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const getStudentById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const scope = req.schoolReadScope;
    if (!scope) throw new ApiError(500, "School read scope not initialized");

    const { id } = req.params;
    if (!id || Array.isArray(id)) {
      res.status(400).json({ success: false, message: "Student ID is required" });
      return;
    }
    const student = await getStudentByIdService(id, scope);
    res.status(200).json({
      success: true,
      data: student,
      message: "Student fetched successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const updateStudent = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    if (!id || Array.isArray(id)) {
      res.status(400).json({ success: false, message: "Student ID is required" });
      return;
    }
    if (!req.user) throw new ApiError(401, "Unauthorized");
    const student = await updateStudentService(id, req.body, req.user);
    res.status(200).json({
      success: true,
      data: student,
      message: "Student updated successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const deleteStudent = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    if (!id || Array.isArray(id)) {
      res.status(400).json({ success: false, message: "Student ID is required" });
      return;
    }
    if (!req.user) throw new ApiError(401, "Unauthorized");
    await deleteStudentService(id, req.user);
    res.status(200).json({
      success: true,
      data: null,
      message: "Student deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const getStudentDashboard = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const scope = req.schoolReadScope;
    if (!scope) throw new ApiError(500, "School read scope not initialized");

    const dashboardData = await getStudentDashboardService(scope);
    res.status(200).json({
      success: true,
      data: dashboardData,
      message: "Dashboard data fetched successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const syncClassStudents = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await syncClassStudentsService();
    res.status(200).json({
      success: true,
      data: result,
      message: "Class students synced successfully",
    });
  } catch (error) {
    next(error);
  }
};
