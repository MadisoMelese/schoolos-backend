import type { Types } from "mongoose";
import mongoose from "mongoose";
import Teacher from "../models/Teacher.model.js";
import Class from "../models/Class.model.js";
import type { ITeacher } from "../models/Teacher.model.js";
import type { IUserDocument } from "../models/User.model.js";
import ApiError from "../utils/ApiError.js";
import type { SchoolReadScope } from "../types/schoolReadScope.js";
import {
  assertSchoolDataAccess,
  assertSchoolMutationAllowed,
  idInObjectIdList,
} from "../utils/schoolReadAccess.js";

const visibleTeacherIdsForStudent = async (
  studentDocId: Types.ObjectId,
  classIds: Types.ObjectId[],
): Promise<Types.ObjectId[]> => {
  const classes = await Class.find({
    $or: [{ _id: { $in: classIds } }, { students: studentDocId }],
  })
    .select("teacherId")
    .lean();

  const set = new Set<string>();
  for (const c of classes) {
    if (c.teacherId) set.add(c.teacherId.toString());
  }
  return [...set].map((id) => new mongoose.Types.ObjectId(id));
};

export const createTeacherService = async (
  data: Partial<ITeacher>,
  actor: IUserDocument,
) => {
  assertSchoolMutationAllowed(actor);

  const existing = await Teacher.findOne({
    $or: [{ teacherId: data.teacherId }, { userId: data.userId }],
  } as Record<string, unknown>);

  if (existing) {
    throw new ApiError(400, "Teacher with this ID or user already exists");
  }

  const teacher = await Teacher.create(data);
  return teacher;
};

export const getAllTeachersService = async (
  filters: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  },
  scope: SchoolReadScope,
) => {
  assertSchoolDataAccess(scope);

  const { status, search, page = 1, limit = 20 } = filters;

  const query: Record<string, unknown> = {};

  if (status) query.status = status;
  if (search) {
    query.$or = [
      { firstName: { $regex: search, $options: "i" } },
      { lastName: { $regex: search, $options: "i" } },
      { teacherId: { $regex: search, $options: "i" } },
      { subject: { $regex: search, $options: "i" } },
    ];
  }

  if (scope.kind === "teacher") {
    query._id = scope.teacherDocId;
  }

  if (scope.kind === "student") {
    const ids = await visibleTeacherIdsForStudent(
      scope.studentDocId,
      scope.classIds,
    );
    query._id = { $in: ids.length ? ids : [] };
  }

  const skip = (page - 1) * limit;

  const [teachers, total] = await Promise.all([
    Teacher.find(query)
      .populate("userId", "email")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }),
    Teacher.countDocuments(query),
  ]);

  return {
    teachers,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
};

export const getTeacherByIdService = async (
  id: string,
  scope: SchoolReadScope,
) => {
  assertSchoolDataAccess(scope);

  if (scope.kind === "teacher" && id !== scope.teacherDocId.toString()) {
    throw new ApiError(403, "You can only view your own teacher profile.");
  }

  if (scope.kind === "student") {
    const ids = await visibleTeacherIdsForStudent(
      scope.studentDocId,
      scope.classIds,
    );
    if (!idInObjectIdList(id, ids)) {
      throw new ApiError(403, "You do not have access to this teacher.");
    }
  }

  const teacher = await Teacher.findById(id).populate("userId", "email");

  if (!teacher) {
    throw new ApiError(404, "Teacher not found");
  }

  return teacher;
};

export const updateTeacherService = async (
  id: string,
  data: Partial<ITeacher>,
  actor: IUserDocument,
) => {
  assertSchoolMutationAllowed(actor);

  const teacher = await Teacher.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });

  if (!teacher) {
    throw new ApiError(404, "Teacher not found");
  }

  return teacher;
};

export const deleteTeacherService = async (
  id: string,
  actor: IUserDocument,
) => {
  assertSchoolMutationAllowed(actor);

  const teacher = await Teacher.findByIdAndDelete(id);

  if (!teacher) {
    throw new ApiError(404, "Teacher not found");
  }

  return teacher;
};

export const getTeacherClassStudentsService = async (
  teacherId: string,
  scope: SchoolReadScope,
) => {
  assertSchoolDataAccess(scope);

  // Only teachers can view their own class students
  if (scope.kind === "teacher" && teacherId !== scope.teacherDocId.toString()) {
    throw new ApiError(403, "You can only view your own class students.");
  }

  // Get the teacher
  const teacher = await Teacher.findById(teacherId);
  if (!teacher) {
    throw new ApiError(404, "Teacher not found");
  }

  // Find the class assigned to this teacher
  const classDoc = await Class.findOne({ teacherId: new mongoose.Types.ObjectId(teacherId) })
    .populate({
      path: "students",
      model: "Student",
      select: "studentId firstName lastName email gender status",
    });

  if (!classDoc) {
    return {
      class: null,
      students: [],
      message: "No class assigned to this teacher",
    };
  }

  return {
    class: {
      _id: classDoc._id,
      name: classDoc.name,
      section: classDoc.section,
      grade: classDoc.grade,
      capacity: classDoc.capacity,
      academicYear: classDoc.academicYear,
      status: classDoc.status,
    },
    students: classDoc.students || [],
  };
};
