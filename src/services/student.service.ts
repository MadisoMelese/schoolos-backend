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
import {
  validatePagination,
  sanitizeSearchQuery,
  buildPaginationMeta,
  parseFields,
} from "../utils/pagination.js";
import { canAccessStudent, canMutate, assertPermission } from "../utils/permissions.js";

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

  // If student has a classId, add student to Class.students array
  if (data.classId) {
    const Class = (await import("../models/Class.model.js")).default;
    const classDoc = await Class.findById(data.classId);
    if (classDoc) {
      if (!classDoc.students) {
        classDoc.students = [];
      }
      // Check if student is not already in the array
      if (!classDoc.students.some(s => s.toString() === student._id.toString())) {
        classDoc.students.push(student._id);
        await classDoc.save();
      }
    }
  }

  return student;
};

export const getAllStudentsService = async (
  filters: {
    status?: string;
    classId?: string;
    search?: string;
    page?: number;
    limit?: number;
    fields?: string;
    cursor?: string;
  },
  scope: SchoolReadScope,
) => {
  assertSchoolDataAccess(scope);

  const { status, classId, search, page, limit, fields, cursor } = filters;
  
  // Validate and normalize pagination
  const { validatedPage, validatedLimit, skip } = validatePagination(page, limit, cursor);
  
  // Sanitize search query to prevent ReDoS
  const sanitizedSearch = sanitizeSearchQuery(search);

  const query: Record<string, unknown> = {};

  if (status) query.status = status;
  if (classId) query.classId = classId;
  if (sanitizedSearch) {
    query.$or = [
      { firstName: { $regex: sanitizedSearch, $options: "i" } },
      { lastName: { $regex: sanitizedSearch, $options: "i" } },
      { studentId: { $regex: sanitizedSearch, $options: "i" } },
    ];
  }

  // Apply scope-based filtering
  if (scope.kind === "student") {
    query._id = scope.studentDocId;
  } else if (scope.kind === "teacher") {
    if (scope.rosterStudentIds.length === 0) {
      query._id = { $in: [] };
    } else {
      query._id = { $in: scope.rosterStudentIds };
    }
  }

  // Parse field selection
  const projection = parseFields(fields);

  const [students, total] = await Promise.all([
    Student.find(query)
      .populate("classId", "name section grade")
      .populate("userId", "email")
      .skip(skip)
      .limit(validatedLimit)
      .sort({ createdAt: -1 })
      .select(projection || {}),
    Student.countDocuments(query),
  ]);

  return {
    students,
    ...buildPaginationMeta(total, validatedPage, validatedLimit),
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
    .populate("classId", "name grade section")
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

  // Get the current student to check for classId changes
  const currentStudent = await Student.findById(id);
  if (!currentStudent) {
    throw new ApiError(404, "Student not found");
  }

  const oldClassId = currentStudent.classId?.toString();
  const newClassId = data.classId?.toString();

  const student = await Student.findByIdAndUpdate(id, data, {
    returnDocument: 'after',
    runValidators: true,
  });

  if (!student) {
    throw new ApiError(404, "Student not found");
  }

  // Handle class assignment changes
  const Class = (await import("../models/Class.model.js")).default;

  // If classId changed, update both old and new class's students arrays
  if (oldClassId !== newClassId) {
    // Remove from old class
    if (oldClassId) {
      const oldClass = await Class.findById(oldClassId);
      if (oldClass && oldClass.students) {
        oldClass.students = oldClass.students.filter(
          s => s.toString() !== id
        );
        await oldClass.save();
      }
    }

    // Add to new class
    if (newClassId) {
      const newClass = await Class.findById(newClassId);
      if (newClass) {
        if (!newClass.students) {
          newClass.students = [];
        }
        if (!newClass.students.some(s => s.toString() === id)) {
          newClass.students.push(student._id);
          await newClass.save();
        }
      }
    }
  }

  return student;
};

export const deleteStudentService = async (
  id: string,
  actor: IUserDocument,
) => {
  assertSchoolMutationAllowed(actor);

  // Get student before deletion to get classId
  const student = await Student.findById(id);

  if (!student) {
    throw new ApiError(404, "Student not found");
  }

  // Remove student from class if assigned
  if (student.classId) {
    const Class = (await import("../models/Class.model.js")).default;
    const classDoc = await Class.findById(student.classId);
    if (classDoc && classDoc.students) {
      classDoc.students = classDoc.students.filter(
        s => s.toString() !== id
      );
      await classDoc.save();
    }
  }

  // Delete the student
  await Student.findByIdAndDelete(id);

  return student;
};

// Utility function to sync all Class.students arrays based on Student.classId
export const syncClassStudentsService = async () => {
  const Class = (await import("../models/Class.model.js")).default;
  const mongoose = (await import("mongoose")).default;
  
  // Get all students with classId
  const students = await Student.find({ classId: { $ne: null, $exists: true } });
  
  // Group students by classId
  const classStudentsMap = new Map<string, string[]>();
  
  for (const student of students) {
    if (student.classId) {
      const classIdStr = student.classId.toString();
      if (!classStudentsMap.has(classIdStr)) {
        classStudentsMap.set(classIdStr, []);
      }
      classStudentsMap.get(classIdStr)!.push(student._id.toString());
    }
  }
  
  // Update each class's students array
  let updatedCount = 0;
  for (const [classId, studentIds] of classStudentsMap) {
    const classDoc = await Class.findById(classId);
    if (classDoc) {
      const studentObjectIds = studentIds.map(id => new mongoose.Types.ObjectId(id));
      classDoc.students = studentObjectIds;
      await classDoc.save();
      updatedCount++;
    }
  }
  
  return {
    totalStudents: students.length,
    updatedClasses: updatedCount,
  };
};

export const getStudentDashboardService = async (
  scope: SchoolReadScope,
) => {
  assertSchoolDataAccess(scope);

  if (scope.kind !== "student") {
    throw new ApiError(403, "Only students can access their dashboard");
  }

  const studentId = scope.studentDocId;

  // Import models dynamically to avoid circular dependencies
  const Grade = (await import("../models/Grade.model.js")).default;
  const Attendance = (await import("../models/Attendance.model.js")).default;
  const Exam = (await import("../models/Exam.model.js")).default;
  const Fee = (await import("../models/Fee.model.js")).default;
  const Message = (await import("../models/Message.model.js")).default;
  const User = (await import("../models/User.model.js")).default;

  // Get student's user ID to fetch messages
  const student = await Student.findById(studentId).select("userId");
  if (!student) {
    throw new ApiError(404, "Student not found");
  }

  // Fetch all dashboard data in parallel
  const [grades, attendance, exams, fees, messages] = await Promise.all([
    Grade.find({ studentId }).sort({ createdAt: -1 }).limit(5),
    Attendance.find({ studentId }).sort({ date: -1 }).limit(10),
    Exam.find({ classId: { $in: scope.classIds }, date: { $gte: new Date() } })
      .sort({ date: 1 })
      .limit(5),
    Fee.find({ studentId }).sort({ createdAt: -1 }).limit(5),
    Message.find({
      receiverId: student.userId,
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("senderId", "firstName lastName"),
  ]);

  // Calculate attendance percentage
  const totalAttendance = await Attendance.countDocuments({ studentId });
  const presentDays = await Attendance.countDocuments({
    studentId,
    status: "present",
  });
  const attendancePercentage =
    totalAttendance > 0 ? Math.round((presentDays / totalAttendance) * 100) : 0;

  // Calculate fee summary
  const feeSummary = await Fee.aggregate([
    { $match: { studentId } },
    {
      $group: {
        _id: null,
        totalFees: { $sum: "$amount" },
        totalPaid: {
          $sum: {
            $cond: [{ $eq: ["$status", "paid"] }, "$amount", 0],
          },
        },
      },
    },
  ]);

  const { totalFees = 0, totalPaid = 0 } = feeSummary[0] || {};
  const outstandingBalance = totalFees - totalPaid;

  // Count unread messages
  const unreadMessageCount = await Message.countDocuments({
    receiverId: student.userId,
    isRead: false,
  });

  return {
    grades,
    attendance,
    exams,
    fees,
    messages,
    attendancePercentage,
    feeSummary: {
      totalFees,
      totalPaid,
      outstandingBalance,
    },
    unreadMessageCount,
  };
};
