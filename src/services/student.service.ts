import Student from "../models/Student.model.js";
import type { IStudent } from "../models/Student.model.js";
import ApiError from "../utils/ApiError.js";
import type { IUserDocument } from "../models/User.model.js";
import type { SchoolReadScope } from "../types/schoolReadScope.js";
import {
  assertSchoolDataAccess,
  assertSchoolMutationAllowed,
  idInObjectIdList,
} from "../utils/schoolReadAccess.js";

export const createStudentService = async (
  data: Partial<IStudent>,
  actor: IUserDocument,
) => {
  assertSchoolMutationAllowed(actor);

  const existing = await Student.findOne({
    $or: [{ studentId: data.studentId }, { userId: data.userId }],
  } as Record<string, unknown>);

  if (existing) {
    throw new ApiError(400, "Student with this ID or user already exists");
  }

  const student = await Student.create(data);
  return student;
};

export const getAllStudentsService = async (
  filters: {
    status?: string;
    classId?: string;
    search?: string;
    page?: number;
    limit?: number;
  },
  scope: SchoolReadScope,
) => {
  assertSchoolDataAccess(scope);

  const { status, classId, search, page = 1, limit = 20 } = filters;

  const query: Record<string, unknown> = {};

  if (status) query.status = status;
  if (classId) query.classId = classId;
  if (search) {
    query.$or = [
      { firstName: { $regex: search, $options: "i" } },
      { lastName: { $regex: search, $options: "i" } },
      { studentId: { $regex: search, $options: "i" } },
    ];
  }

  if (scope.kind === "student") {
    query._id = scope.studentDocId;
  } else if (scope.kind === "teacher") {
    if (scope.rosterStudentIds.length === 0) {
      query._id = { $in: [] };
    } else {
      query._id = { $in: scope.rosterStudentIds };
    }
  }

  const skip = (page - 1) * limit;

  const [students, total] = await Promise.all([
    Student.find(query)
      .populate("classId", "name section grade")
      .populate("userId", "email")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }),
    Student.countDocuments(query),
  ]);

  return {
    students,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
};

export const getStudentByIdService = async (
  id: string,
  scope: SchoolReadScope,
) => {
  assertSchoolDataAccess(scope);

  if (scope.kind === "student" && id !== scope.studentDocId.toString()) {
    throw new ApiError(403, "You can only view your own student record.");
  }

  if (
    scope.kind === "teacher" &&
    !idInObjectIdList(id, scope.rosterStudentIds)
  ) {
    throw new ApiError(403, "You do not have access to this student.");
  }

  const student = await Student.findById(id)
    .populate("classId", "name section")
    .populate("userId", "email");

  if (!student) {
    throw new ApiError(404, "Student not found");
  }

  return student;
};

export const updateStudentService = async (
  id: string,
  data: Partial<IStudent>,
  actor: IUserDocument,
) => {
  assertSchoolMutationAllowed(actor);

  const student = await Student.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });

  if (!student) {
    throw new ApiError(404, "Student not found");
  }

  return student;
};

export const deleteStudentService = async (
  id: string,
  actor: IUserDocument,
) => {
  assertSchoolMutationAllowed(actor);

  const student = await Student.findByIdAndDelete(id);

  if (!student) {
    throw new ApiError(404, "Student not found");
  }

  return student;
};
