import { z } from "zod";

export const createExamSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  classId: z.string().min(1, "Class ID is required"),
  subject: z.string().min(1, "Subject is required"),
  teacherId: z.string().min(1, "Teacher ID is required"),
  date: z.string().min(1, "Date is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  totalMarks: z.number().min(1, "Total marks must be at least 1"),
  passingMarks: z.number().min(1, "Passing marks must be at least 1"),
  academicYear: z.string().min(1, "Academic year is required"),
  status: z
    .enum(["scheduled", "ongoing", "completed", "cancelled"] as const)
    .optional(),
});

export const updateExamSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  classId: z.string().min(1).optional(),
  subject: z.string().min(1).optional(),
  teacherId: z.string().min(1).optional(),
  date: z.string().optional(),
  startTime: z.string().min(1).optional(),
  endTime: z.string().min(1).optional(),
  totalMarks: z.number().min(1).optional(),
  passingMarks: z.number().min(1).optional(),
  academicYear: z.string().min(1).optional(),
  status: z
    .enum(["scheduled", "ongoing", "completed", "cancelled"] as const)
    .optional(),
});