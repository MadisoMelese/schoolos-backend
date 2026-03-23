import type { Request, Response, NextFunction } from "express";
import {
  createExamService,
  getAllExamsService,
  getExamByIdService,
  updateExamService,
  deleteExamService,
} from "../services/exam.service.js";

export const createExam = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const exam = await createExamService(req.body);
    res.status(201).json({ success: true, data: exam, message: "Exam created successfully" });
  } catch (error) {
    next(error);
  }
};

export const getAllExams = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { classId, teacherId, subject, status, academicYear, page, limit } = req.query;

    const filters: {
      classId?: string;
      teacherId?: string;
      subject?: string;
      status?: string;
      academicYear?: string;
      page?: number;
      limit?: number;
    } = {};

    if (classId) filters.classId = classId as string;
    if (teacherId) filters.teacherId = teacherId as string;
    if (subject) filters.subject = subject as string;
    if (status) filters.status = status as string;
    if (academicYear) filters.academicYear = academicYear as string;
    if (page) filters.page = Number(page);
    if (limit) filters.limit = Number(limit);

    const result = await getAllExamsService(filters);
    res.status(200).json({ success: true, data: result, message: "Exams fetched successfully" });
  } catch (error) {
    next(error);
  }
};

export const getExamById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    if (!id || Array.isArray(id)) {
      res.status(400).json({ success: false, message: "Exam ID is required" });
      return;
    }
    const exam = await getExamByIdService(id);
    res.status(200).json({ success: true, data: exam, message: "Exam fetched successfully" });
  } catch (error) {
    next(error);
  }
};

export const updateExam = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    if (!id || Array.isArray(id)) {
      res.status(400).json({ success: false, message: "Exam ID is required" });
      return;
    }
    const exam = await updateExamService(id, req.body);
    res.status(200).json({ success: true, data: exam, message: "Exam updated successfully" });
  } catch (error) {
    next(error);
  }
};

export const deleteExam = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    if (!id || Array.isArray(id)) {
      res.status(400).json({ success: false, message: "Exam ID is required" });
      return;
    }
    await deleteExamService(id);
    res.status(200).json({ success: true, data: null, message: "Exam deleted successfully" });
  } catch (error) {
    next(error);
  }
};