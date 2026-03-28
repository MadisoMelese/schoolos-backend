import type { Request, Response, NextFunction } from "express";
import {
  createClassService,
  getAllClassesService,
  getClassByIdService,
  updateClassService,
  deleteClassService,
  addStudentToClassService,
  removeStudentFromClassService,
} from "../services/class.service.js";
import ApiError from "../utils/ApiError.js";

export const createClass = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) throw new ApiError(401, "Unauthorized");
    const newClass = await createClassService(req.body, req.user);
    res.status(201).json({
      success: true,
      data: newClass,
      message: "Class created successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const getAllClasses = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const scope = req.schoolReadScope;
    if (!scope) throw new ApiError(500, "School read scope not initialized");

    const { status, grade, academicYear, search, page, limit } = req.query;

    const filters: {
      status?: string;
      grade?: string;
      academicYear?: string;
      search?: string;
      page?: number;
      limit?: number;
    } = {};

    if (status) filters.status = status as string;
    if (grade) filters.grade = grade as string;
    if (academicYear) filters.academicYear = academicYear as string;
    if (search) filters.search = search as string;
    if (page) filters.page = Number(page);
    if (limit) filters.limit = Number(limit);

    const result = await getAllClassesService(filters, scope);
    res.status(200).json({
      success: true,
      data: result,
      message: "Classes fetched successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const getClassById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const scope = req.schoolReadScope;
    if (!scope) throw new ApiError(500, "School read scope not initialized");

    const { id } = req.params;
    if (!id || Array.isArray(id)) {
      res.status(400).json({ success: false, message: "Class ID is required" });
      return;
    }
    const foundClass = await getClassByIdService(id, scope);
    res.status(200).json({
      success: true,
      data: foundClass,
      message: "Class fetched successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const updateClass = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    if (!id || Array.isArray(id)) {
      res.status(400).json({ success: false, message: "Class ID is required" });
      return;
    }
    if (!req.user) throw new ApiError(401, "Unauthorized");
    const foundClass = await updateClassService(id, req.body, req.user);
    res.status(200).json({
      success: true,
      data: foundClass,
      message: "Class updated successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const deleteClass = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    if (!id || Array.isArray(id)) {
      res.status(400).json({ success: false, message: "Class ID is required" });
      return;
    }
    if (!req.user) throw new ApiError(401, "Unauthorized");
    await deleteClassService(id, req.user);
    res.status(200).json({
      success: true,
      data: null,
      message: "Class deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const addStudentToClass = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    if (!id || Array.isArray(id)) {
      res.status(400).json({ success: false, message: "Class ID is required" });
      return;
    }
    const { studentId } = req.body;
    if (!req.user) throw new ApiError(401, "Unauthorized");
    const foundClass = await addStudentToClassService(id, studentId, req.user);
    res.status(200).json({
      success: true,
      data: foundClass,
      message: "Student added to class successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const removeStudentFromClass = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id, studentId } = req.params;
    if (!id || Array.isArray(id) || !studentId || Array.isArray(studentId)) {
      res
        .status(400)
        .json({ success: false, message: "Class ID and Student ID are required" });
      return;
    }
    if (!req.user) throw new ApiError(401, "Unauthorized");
    const foundClass = await removeStudentFromClassService(
      id,
      studentId,
      req.user,
    );
    res.status(200).json({
      success: true,
      data: foundClass,
      message: "Student removed from class successfully",
    });
  } catch (error) {
    next(error);
  }
};
