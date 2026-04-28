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
import { cache, CacheKeys } from "../utils/cache.js";

// Cache TTL: 2 minutes for dashboard data
const DASHBOARD_CACHE_TTL = 2 * 60 * 1000;

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
    returnDocument: 'after',
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

  // Determine the actual teacher ID
  let actualTeacherId: mongoose.Types.ObjectId;

  if (scope.kind === "teacher") {
    // For teachers, always use their own teacher document ID from scope
    actualTeacherId = scope.teacherDocId;
  } else if (scope.kind === "admin") {
    // Admins can view any teacher's class students
    // But if "me" is passed, they don't have a teacher profile, so return empty
    if (teacherId === "me") {
      return {
        class: null,
        students: [],
        message: "Admins don't have assigned classes. Use a specific teacher ID.",
      };
    }
    actualTeacherId = new mongoose.Types.ObjectId(teacherId);
  } else {
    throw new ApiError(403, "You do not have access to view class students.");
  }

  // Find the class assigned to this teacher
  const classDoc = await Class.findOne({ teacherId: actualTeacherId })
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


/**
 * Get teacher dashboard data with optimized queries
 * Uses aggregation and caching for better performance
 */
export const getTeacherDashboardService = async (
  scope: SchoolReadScope,
) => {
  assertSchoolDataAccess(scope);

  if (scope.kind !== "teacher") {
    throw new ApiError(403, "Only teachers can access their dashboard");
  }

  const teacherId = scope.teacherDocId;
  const cacheKey = CacheKeys.dashboard("teacher", teacherId.toString());

  // Try cache first
  const cached = cache.get<any>(cacheKey);
  if (cached) {
    return cached;
  }

  // Import models dynamically
  const Grade = (await import("../models/Grade.model.js")).default;
  const Attendance = (await import("../models/Attendance.model.js")).default;
  const Message = (await import("../models/Message.model.js")).default;
  const User = (await import("../models/User.model.js")).default;

  // Get teacher's user ID for messages
  const teacher = await Teacher.findById(teacherId).select("userId").lean();
  if (!teacher) {
    throw new ApiError(404, "Teacher not found");
  }

  // Run all queries in parallel using Promise.all
  const [
    classes,
    recentGrades,
    attendanceStats,
    pendingGradesCount,
    unreadMessagesCount,
    recentMessages,
  ] = await Promise.all([
    // Get assigned classes with student count
    Class.find({ teacherId })
      .select("name section grade capacity academicYear status students")
      .lean(),

    // Get recent grades (last 10)
    Grade.find({ teacherId })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("studentId", "firstName lastName studentId")
      .populate("classId", "name section")
      .lean(),

    // Get attendance stats for today using aggregation
    Attendance.aggregate([
      {
        $match: {
          teacherId,
          date: {
            $gte: new Date(new Date().setHours(0, 0, 0, 0)),
            $lt: new Date(new Date().setHours(23, 59, 59, 999)),
          },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          present: {
            $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] },
          },
          absent: {
            $sum: { $cond: [{ $eq: ["$status", "absent"] }, 1, 0] },
          },
          late: {
            $sum: { $cond: [{ $eq: ["$status", "late"] }, 1, 0] },
          },
        },
      },
    ]),

    // Count pending grades (students without grades for recent exams)
    Grade.countDocuments({ teacherId, marksObtained: { $exists: false } }),

    // Count unread messages
    Message.countDocuments({ receiverId: teacher.userId, isRead: false }),

    // Get recent messages
    Message.find({ receiverId: teacher.userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("senderId", "firstName lastName")
      .lean(),
  ]);

  // Process classes data
  const processedClasses = classes.map((c) => ({
    _id: c._id,
    name: c.name,
    section: c.section,
    grade: c.grade,
    capacity: c.capacity,
    academicYear: c.academicYear,
    status: c.status,
    studentCount: c.students?.length || 0,
  }));

  // Calculate total students across all classes
  const totalStudents = scope.rosterStudentIds.length;

  const result = {
    classes: processedClasses,
    totalClasses: classes.length,
    totalStudents,
    recentGrades,
    attendanceStats: attendanceStats[0] || { total: 0, present: 0, absent: 0, late: 0 },
    pendingGradesCount,
    unreadMessagesCount,
    recentMessages,
  };

  // Cache the result
  cache.set(cacheKey, result, DASHBOARD_CACHE_TTL);

  return result;
};
