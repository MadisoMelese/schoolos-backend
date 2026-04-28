import type { RequestHandler } from "express";
import mongoose from "mongoose";
import Teacher from "../models/Teacher.model.js";
import Student from "../models/Student.model.js";
import Class from "../models/Class.model.js";
import type { SchoolReadScope } from "../types/schoolReadScope.js";
import ApiError from "../utils/ApiError.js";
import { cache, CacheKeys } from "../utils/cache.js";

// Cache TTL: 5 minutes for scope data
const SCOPE_CACHE_TTL = 5 * 60 * 1000;

/**
 * Build teacher scope from database
 */
async function buildTeacherScope(userId: mongoose.Types.ObjectId): Promise<SchoolReadScope> {
  const teacher = await Teacher.findOne({ userId }).select("_id").lean();
  if (!teacher?._id) {
    return { kind: "none" };
  }

  const classes = await Class.find({ teacherId: teacher._id })
    .select("students")
    .lean();

  const taughtClassIds = classes.map((c) => c._id as mongoose.Types.ObjectId);
  const roster = new Set<string>();
  for (const c of classes) {
    for (const sid of c.students ?? []) {
      roster.add(sid.toString());
    }
  }

  return {
    kind: "teacher",
    teacherDocId: teacher._id as mongoose.Types.ObjectId,
    rosterStudentIds: [...roster].map((id) => new mongoose.Types.ObjectId(id)),
    taughtClassIds,
  };
}

/**
 * Build student scope from database
 */
async function buildStudentScope(userId: mongoose.Types.ObjectId): Promise<SchoolReadScope> {
  const student = await Student.findOne({ userId }).select("_id classId").lean();
  if (!student?._id) {
    return { kind: "none" };
  }

  const classIdSet = new Set<string>();
  if (student.classId) {
    classIdSet.add(student.classId.toString());
  }
  const enrolled = await Class.find({ students: student._id })
    .select("_id")
    .lean();
  for (const c of enrolled) {
    if (c._id) classIdSet.add(c._id.toString());
  }

  return {
    kind: "student",
    studentDocId: student._id as mongoose.Types.ObjectId,
    classIds: [...classIdSet].map((id) => new mongoose.Types.ObjectId(id)),
  };
}

/**
 * After `protect`, resolves whether the user is admin, teacher, student, or has no school profile.
 * Attaches `req.schoolReadScope` for read authorization in services.
 * 
 * Uses in-memory caching to avoid repeated database queries for the same user.
 */
const loadSchoolReadScope: RequestHandler = async (req, _res, next) => {
  try {
    if (!req.user) {
      throw new ApiError(401, "Unauthorized");
    }

    // Admin scope is static, no need to cache
    if (req.user.role === "admin") {
      req.schoolReadScope = { kind: "admin" } satisfies SchoolReadScope;
      next();
      return;
    }

    const userId = req.user._id.toString();
    const cacheKey = CacheKeys.schoolReadScope(userId);

    // Try to get from cache first
    const cachedScope = cache.get<SchoolReadScope>(cacheKey);
    if (cachedScope) {
      req.schoolReadScope = cachedScope;
      next();
      return;
    }

    // Build scope based on user role
    let scope: SchoolReadScope;
    
    if (req.user.role === "teacher") {
      scope = await buildTeacherScope(req.user._id);
    } else if (req.user.role === "student") {
      scope = await buildStudentScope(req.user._id);
    } else if (req.user.role === "parent") {
      // Parents have limited scope - they view their child's data
      // For now, set to none as parent access is handled differently
      scope = { kind: "none" };
    } else {
      scope = { kind: "none" };
    }

    // Cache the scope
    cache.set(cacheKey, scope, SCOPE_CACHE_TTL);

    req.schoolReadScope = scope;
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Invalidate scope cache for a user (call when user's profile changes)
 */
export function invalidateScopeCache(userId: string): void {
  cache.delete(CacheKeys.schoolReadScope(userId));
}

export default loadSchoolReadScope;
