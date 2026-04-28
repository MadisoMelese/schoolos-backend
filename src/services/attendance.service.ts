import Attendance from "../models/Attendance.model.js";
import type { IAttendance } from "../models/Attendance.model.js";
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
  buildPaginationMeta,
  parseFields,
} from "../utils/pagination.js";
import { canAccessAttendance, assertPermission } from "../utils/permissions.js";

export const createAttendanceService = async (
  data: Partial<IAttendance>,
  actor: IUserDocument,
) => {
  assertSchoolMutationAllowed(actor);

  const existing = await Attendance.findOne({
    studentId: data.studentId,
    classId: data.classId,
    date: data.date,
  } as Record<string, unknown>);

  if (existing) {
    throw new ApiError(
      400,
      "Attendance already recorded for this student on this date",
    );
  }

  const attendance = await Attendance.create(data);
  return attendance;
};

export const bulkCreateAttendanceService = async (
  data: {
    classId: string;
    teacherId: string;
    date: string;
    records: { studentId: string; status: string; note?: string }[];
  },
  actor: IUserDocument,
) => {
  assertSchoolMutationAllowed(actor);

  const { classId, teacherId, date, records } = data;

  // Resolve teacherId - if 'me' is passed, get from actor's scope
  let resolvedTeacherId = teacherId;
  if (teacherId === 'me' && actor.role === 'teacher') {
    // Get the teacher document for this user
    const Teacher = (await import('../models/Teacher.model.js')).default;
    const teacherDoc = await Teacher.findOne({ userId: actor._id });
    if (!teacherDoc) {
      throw new ApiError(400, 'Teacher profile not found for this user');
    }
    resolvedTeacherId = teacherDoc._id.toString();
  }

  const attendanceDocs = records.map((record) => ({
    classId,
    teacherId: resolvedTeacherId,
    date: new Date(date),
    studentId: record.studentId,
    status: record.status,
    ...(record.note && { note: record.note }),
  }));

  const result = await Attendance.insertMany(attendanceDocs, {
    ordered: false,
  });

  return result;
};

const mergeTeacherAttendanceScope = (
  base: Record<string, unknown>,
  scope: Extract<SchoolReadScope, { kind: "teacher" }>,
): Record<string, unknown> => {
  const scopeOr = [
    { teacherId: scope.teacherDocId },
    ...(scope.rosterStudentIds.length > 0
      ? [{ studentId: { $in: scope.rosterStudentIds } }]
      : []),
  ];
  const existingAnd = base.$and as Record<string, unknown>[] | undefined;
  if (existingAnd) {
    return { $and: [...existingAnd, { $or: scopeOr }] };
  }
  if (Object.keys(base).length === 0) {
    return { $or: scopeOr };
  }
  return { $and: [base, { $or: scopeOr }] };
};

export const getAllAttendanceService = async (
  filters: {
    studentId?: string;
    classId?: string;
    teacherId?: string;
    status?: string;
    date?: string;
    page?: number;
    limit?: number;
    fields?: string;
    cursor?: string;
  },
  scope: SchoolReadScope,
) => {
  assertSchoolDataAccess(scope);

  const {
    studentId,
    classId,
    teacherId,
    status,
    date,
    page,
    limit,
    fields,
    cursor,
  } = filters;

  // Validate and normalize pagination
  const { validatedPage, validatedLimit, skip } = validatePagination(page, limit, cursor);

  const base: Record<string, unknown> = {};
  if (status) base.status = status;
  if (date) base.date = new Date(date);

  let query: Record<string, unknown>;

  if (scope.kind === "student") {
    base.studentId = scope.studentDocId;
    if (classId && !idInObjectIdList(classId, scope.classIds)) {
      throw new ApiError(403, "You do not have access to this class.");
    }
    if (classId) base.classId = classId;
    query = base;
  } else if (scope.kind === "teacher") {
    if (studentId && !idInObjectIdList(studentId, scope.rosterStudentIds)) {
      throw new ApiError(
        403,
        "You do not have access to this student's attendance.",
      );
    }
    if (classId && !idInObjectIdList(classId, scope.taughtClassIds)) {
      throw new ApiError(403, "You do not have access to attendance for this class.");
    }
    if (teacherId && teacherId !== scope.teacherDocId.toString()) {
      throw new ApiError(
        403,
        "You do not have access to these attendance records.",
      );
    }
    if (studentId) base.studentId = studentId;
    if (classId) base.classId = classId;
    if (teacherId) base.teacherId = teacherId;
    query = mergeTeacherAttendanceScope(base, scope);
  } else {
    if (studentId) base.studentId = studentId;
    if (classId) base.classId = classId;
    if (teacherId) base.teacherId = teacherId;
    query = base;
  }

  // Parse field selection
  const projection = parseFields(fields);

  const [attendance, total] = await Promise.all([
    Attendance.find(query)
      .populate("studentId", "firstName lastName studentId")
      .populate("classId", "name section grade")
      .populate("teacherId", "firstName lastName teacherId")
      .skip(skip)
      .limit(validatedLimit)
      .sort({ date: -1 })
      .select(projection || {}),
    Attendance.countDocuments(query),
  ]);

  return {
    attendance,
    ...buildPaginationMeta(total, validatedPage, validatedLimit),
  };
};

export const getAttendanceByIdService = async (
  id: string,
  scope: SchoolReadScope,
) => {
  assertSchoolDataAccess(scope);

  const raw = await Attendance.findById(id).lean();
  if (!raw) {
    throw new ApiError(404, "Attendance record not found");
  }

  if (scope.kind === "student") {
    if (raw.studentId.toString() !== scope.studentDocId.toString()) {
      throw new ApiError(403, "You do not have access to this record.");
    }
  } else if (scope.kind === "teacher") {
    const inRoster = idInObjectIdList(
      raw.studentId.toString(),
      scope.rosterStudentIds,
    );
    const ownMarking =
      raw.teacherId.toString() === scope.teacherDocId.toString();
    if (!inRoster && !ownMarking) {
      throw new ApiError(403, "You do not have access to this record.");
    }
  }

  const attendance = await Attendance.findById(id)
    .populate("studentId", "firstName lastName studentId")
    .populate("classId", "name section grade")
    .populate("teacherId", "firstName lastName teacherId");

  return attendance!;
};

export const updateAttendanceService = async (
  id: string,
  data: Partial<IAttendance>,
  actor: IUserDocument,
) => {
  assertSchoolMutationAllowed(actor);

  const attendance = await Attendance.findByIdAndUpdate(id, data, {
    returnDocument: 'after',
    runValidators: true,
  });

  if (!attendance) {
    throw new ApiError(404, "Attendance record not found");
  }

  return attendance;
};

export const deleteAttendanceService = async (
  id: string,
  actor: IUserDocument,
) => {
  assertSchoolMutationAllowed(actor);

  const attendance = await Attendance.findByIdAndDelete(id);

  if (!attendance) {
    throw new ApiError(404, "Attendance record not found");
  }

  return attendance;
};

export const getStudentAttendanceSummaryService = async (
  studentId: string,
  classId: string | undefined,
  scope: SchoolReadScope,
) => {
  assertSchoolDataAccess(scope);

  if (scope.kind === "student") {
    if (studentId !== scope.studentDocId.toString()) {
      throw new ApiError(403, "You can only view your own attendance summary.");
    }
    if (classId && !idInObjectIdList(classId, scope.classIds)) {
      throw new ApiError(403, "You do not have access to this class.");
    }
  } else if (scope.kind === "teacher") {
    if (!idInObjectIdList(studentId, scope.rosterStudentIds)) {
      throw new ApiError(
        403,
        "You do not have access to this student's attendance.",
      );
    }
    if (classId && !idInObjectIdList(classId, scope.taughtClassIds)) {
      throw new ApiError(403, "You do not have access to this class.");
    }
  }

  const query: Record<string, unknown> = { studentId };
  if (classId) query.classId = classId;

  const [present, absent, late, excused] = await Promise.all([
    Attendance.countDocuments({ ...query, status: "present" }),
    Attendance.countDocuments({ ...query, status: "absent" }),
    Attendance.countDocuments({ ...query, status: "late" }),
    Attendance.countDocuments({ ...query, status: "excused" }),
  ]);

  const total = present + absent + late + excused;
  const attendanceRate = total > 0 ? ((present + late) / total) * 100 : 0;

  return {
    present,
    absent,
    late,
    excused,
    total,
    attendanceRate: Math.round(attendanceRate * 100) / 100,
  };
};
