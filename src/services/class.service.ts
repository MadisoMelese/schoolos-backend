import Class from "../models/Class.model.js";
import type { IClass } from "../models/Class.model.js";
import ApiError from "../utils/ApiError.js";
import mongoose from "mongoose";
import type { IUserDocument } from "../models/User.model.js";
import type { SchoolReadScope } from "../types/schoolReadScope.js";
import {
  assertSchoolDataAccess,
  assertSchoolMutationAllowed,
  idInObjectIdList,
} from "../utils/schoolReadAccess.js";

export const createClassService = async (
  data: Partial<IClass>,
  actor: IUserDocument,
) => {
  assertSchoolMutationAllowed(actor);

  const existing = await Class.findOne({
    name: data.name,
    section: data.section,
    academicYear: data.academicYear,
  } as Record<string, unknown>);

  if (existing) {
    throw new ApiError(
      400,
      "Class with this name, section and academic year already exists",
    );
  }

  const newClass = await Class.create(data);
  return newClass;
};

export const getAllClassesService = async (
  filters: {
    status?: string;
    grade?: string;
    academicYear?: string;
    search?: string;
    page?: number;
    limit?: number;
  },
  scope: SchoolReadScope,
) => {
  assertSchoolDataAccess(scope);

  const { status, grade, academicYear, search, page = 1, limit = 20 } = filters;

  const query: Record<string, unknown> = {};

  if (status) query.status = status;
  if (grade) query.grade = grade;
  if (academicYear) query.academicYear = academicYear;
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { section: { $regex: search, $options: "i" } },
      { grade: { $regex: search, $options: "i" } },
    ];
  }

  if (scope.kind === "teacher") {
    if (scope.taughtClassIds.length === 0) {
      query._id = { $in: [] };
    } else {
      query._id = { $in: scope.taughtClassIds };
    }
  } else if (scope.kind === "student") {
    const orClause: Record<string, unknown>[] = [
      { students: scope.studentDocId },
    ];
    if (scope.classIds.length > 0) {
      orClause.push({ _id: { $in: scope.classIds } });
    }
    query.$or = orClause;
  }

  const skip = (page - 1) * limit;

  const [classes, total] = await Promise.all([
    Class.find(query)
      .populate("teacherId", "firstName lastName teacherId")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }),
    Class.countDocuments(query),
  ]);

  return {
    classes,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
};

export const getClassByIdService = async (id: string, scope: SchoolReadScope) => {
  assertSchoolDataAccess(scope);

  if (scope.kind === "teacher" && !idInObjectIdList(id, scope.taughtClassIds)) {
    throw new ApiError(403, "You do not have access to this class.");
  }

  if (scope.kind === "student") {
    const allowed =
      idInObjectIdList(id, scope.classIds) ||
      (await Class.exists({ _id: id, students: scope.studentDocId }));
    if (!allowed) {
      throw new ApiError(403, "You do not have access to this class.");
    }
  }

  const foundClass = await Class.findById(id)
    .populate("teacherId", "firstName lastName teacherId subject")
    .populate("students", "firstName lastName studentId status");

  if (!foundClass) {
    throw new ApiError(404, "Class not found");
  }

  return foundClass;
};

export const updateClassService = async (
  id: string,
  data: Partial<IClass>,
  actor: IUserDocument,
) => {
  assertSchoolMutationAllowed(actor);

  const foundClass = await Class.findByIdAndUpdate(id, data, {
    returnDocument: 'after',
    runValidators: true,
  });

  if (!foundClass) {
    throw new ApiError(404, "Class not found");
  }

  return foundClass;
};

export const deleteClassService = async (
  id: string,
  actor: IUserDocument,
) => {
  assertSchoolMutationAllowed(actor);

  const foundClass = await Class.findByIdAndDelete(id);

  if (!foundClass) {
    throw new ApiError(404, "Class not found");
  }

  return foundClass;
};

export const addStudentToClassService = async (
  classId: string,
  studentId: string,
  actor: IUserDocument,
) => {
  assertSchoolMutationAllowed(actor);

  const foundClass = await Class.findById(classId);

  if (!foundClass) {
    throw new ApiError(404, "Class not found");
  }

  // Ensure students array exists
  if (!foundClass.students) {
    foundClass.students = [];
  }

  if (foundClass.students.length >= foundClass.capacity) {
    throw new ApiError(400, "Class is at full capacity");
  }

  const studentObjectId = new mongoose.Types.ObjectId(studentId);

  const alreadyEnrolled = foundClass.students.some(
    (sid) => sid.toString() === studentId,
  );

  if (alreadyEnrolled) {
    throw new ApiError(400, "Student is already enrolled in this class");
  }

  // Add student to class
  foundClass.students.push(studentObjectId);
  await foundClass.save();

  // Update student's classId field for bidirectional consistency
  const Student = mongoose.model("Student");
  await Student.findByIdAndUpdate(studentId, { classId: foundClass._id });

  return foundClass;
};

export const removeStudentFromClassService = async (
  classId: string,
  studentId: string,
  actor: IUserDocument,
) => {
  assertSchoolMutationAllowed(actor);

  const foundClass = await Class.findById(classId);

  if (!foundClass) {
    throw new ApiError(404, "Class not found");
  }

  // Ensure students array exists
  if (!foundClass.students) {
    foundClass.students = [];
  }

  const exists = foundClass.students.some((sid) => sid.toString() === studentId);

  if (!exists) {
    throw new ApiError(400, "Student is not enrolled in this class");
  }

  // Remove student from class
  foundClass.students = foundClass.students.filter(
    (sid) => sid.toString() !== studentId,
  );

  await foundClass.save();

  // Clear student's classId field for bidirectional consistency
  const Student = mongoose.model("Student");
  await Student.findByIdAndUpdate(studentId, { classId: null });

  return foundClass;
};
