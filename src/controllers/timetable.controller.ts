import type { Request, Response, NextFunction } from "express";
import {
  createTimetableService,
  getAllTimetablesService,
  getTimetableByIdService,
  updateTimetableService,
  deleteTimetableService,
} from "../services/timetable.service.js";
import ApiError from "../utils/ApiError.js";

export const createTimetable = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) throw new ApiError(401, "Unauthorized");
    const timetable = await createTimetableService(req.body, req.user);
    res.status(201).json({ success: true, data: timetable, message: "Timetable entry created successfully" });
  } catch (error) {
    next(error);
  }
};

export const getAllTimetables = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const scope = req.schoolReadScope;
    if (!scope) throw new ApiError(500, "School read scope not initialized");

    const { classId, teacherId, dayOfWeek, academicYear, page, limit } = req.query;

    const filters: {
      classId?: string;
      teacherId?: string;
      dayOfWeek?: string;
      academicYear?: string;
      page?: number;
      limit?: number;
    } = {};

    if (classId) filters.classId = classId as string;
    if (teacherId) filters.teacherId = teacherId as string;
    if (dayOfWeek) filters.dayOfWeek = dayOfWeek as string;
    if (academicYear) filters.academicYear = academicYear as string;
    if (page) filters.page = Number(page);
    if (limit) filters.limit = Number(limit);

    const result = await getAllTimetablesService(filters, scope);
    res.status(200).json({ success: true, data: result, message: "Timetables fetched successfully" });
  } catch (error) {
    next(error);
  }
};

export const getTimetableById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const scope = req.schoolReadScope;
    if (!scope) throw new ApiError(500, "School read scope not initialized");

    const { id } = req.params;
    if (!id || Array.isArray(id)) {
      res.status(400).json({ success: false, message: "Timetable ID is required" });
      return;
    }
    const timetable = await getTimetableByIdService(id, scope);
    res.status(200).json({ success: true, data: timetable, message: "Timetable entry fetched successfully" });
  } catch (error) {
    next(error);
  }
};

export const updateTimetable = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    if (!id || Array.isArray(id)) {
      res.status(400).json({ success: false, message: "Timetable ID is required" });
      return;
    }
    if (!req.user) throw new ApiError(401, "Unauthorized");
    const timetable = await updateTimetableService(id, req.body, req.user);
    res.status(200).json({ success: true, data: timetable, message: "Timetable entry updated successfully" });
  } catch (error) {
    next(error);
  }
};

export const deleteTimetable = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    if (!id || Array.isArray(id)) {
      res.status(400).json({ success: false, message: "Timetable ID is required" });
      return;
    }
    if (!req.user) throw new ApiError(401, "Unauthorized");
    await deleteTimetableService(id, req.user);
    res.status(200).json({ success: true, data: null, message: "Timetable entry deleted successfully" });
  } catch (error) {
    next(error);
  }
};