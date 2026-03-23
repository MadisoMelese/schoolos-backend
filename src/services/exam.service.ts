import Exam from "../models/Exam.model.js";
import type { IExam } from "../models/Exam.model.js";
import ApiError from "../utils/ApiError.js";

export const createExamService = async (data: Partial<IExam>) => {
  const exam = await Exam.create(data);
  return exam;
};

export const getAllExamsService = async (filters: {
  classId?: string;
  teacherId?: string;
  subject?: string;
  status?: string;
  academicYear?: string;
  page?: number;
  limit?: number;
}) => {
  const { classId, teacherId, subject, status, academicYear, page = 1, limit = 20 } = filters;

  const query: any = {};

  if (classId) query.classId = classId;
  if (teacherId) query.teacherId = teacherId;
  if (subject) query.subject = { $regex: subject, $options: "i" };
  if (status) query.status = status;
  if (academicYear) query.academicYear = academicYear;

  const skip = (page - 1) * limit;

  const [exams, total] = await Promise.all([
    Exam.find(query)
      .populate("classId", "name section grade")
      .populate("teacherId", "firstName lastName teacherId subject")
      .skip(skip)
      .limit(limit)
      .sort({ date: 1 }),
    Exam.countDocuments(query),
  ]);

  return {
    exams,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
};

export const getExamByIdService = async (id: string) => {
  const exam = await Exam.findById(id)
    .populate("classId", "name section grade")
    .populate("teacherId", "firstName lastName teacherId subject");

  if (!exam) {
    throw new ApiError(404, "Exam not found");
  }

  return exam;
};

export const updateExamService = async (
  id: string,
  data: Partial<IExam>
) => {
  const exam = await Exam.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });

  if (!exam) {
    throw new ApiError(404, "Exam not found");
  }

  return exam;
};

export const deleteExamService = async (id: string) => {
  const exam = await Exam.findByIdAndDelete(id);

  if (!exam) {
    throw new ApiError(404, "Exam not found");
  }

  return exam;
};