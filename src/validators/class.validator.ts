import { z } from "zod";

export const createClassSchema = z.object({
  name: z.string().min(1, "Class name is required"),
  section: z.string().min(1, "Section is required"),
  grade: z.string().min(1, "Grade is required"),
  teacherId: z.string().optional(),
  capacity: z.number().min(1, "Capacity must be at least 1"),
  academicYear: z.string().min(1, "Academic year is required"),
  status: z.enum(["active", "inactive"] as const).optional(),
});

export const updateClassSchema = z.object({
  name: z.string().min(1).optional(),
  section: z.string().min(1).optional(),
  grade: z.string().min(1).optional(),
  teacherId: z.string().optional(),
  capacity: z.number().min(1).optional(),
  academicYear: z.string().min(1).optional(),
  status: z.enum(["active", "inactive"] as const).optional(),
});

export const addStudentToClassSchema = z.object({
  studentId: z.string().min(1, "Student ID is required"),
});