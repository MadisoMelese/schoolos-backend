import type { RequestHandler } from "express";
import mongoose from "mongoose";
import Teacher from "../models/Teacher.model.js";
import Student from "../models/Student.model.js";
import Class from "../models/Class.model.js";
import type { SchoolReadScope } from "../types/schoolReadScope.js";
import ApiError from "../utils/ApiError.js";

/**
 * After `protect`, resolves whether the user is admin, teacher, student, or has no school profile.
 * Attaches `req.schoolReadScope` for read authorization in services.
 */
const loadSchoolReadScope: RequestHandler = async (req, _res, next) => {
  try {
    if (!req.user) {
      throw new ApiError(401, "Unauthorized");
    }

    if (req.user.role === "admin") {
      req.schoolReadScope = { kind: "admin" } satisfies SchoolReadScope;
      next();
      return;
    }

    const [teacher, student] = await Promise.all([
      Teacher.findOne({ userId: req.user._id }).select("_id").lean(),
      Student.findOne({ userId: req.user._id }).select("_id classId").lean(),
    ]);

    if (teacher?._id) {
      const classes = await Class.find({ teacherId: teacher._id })
        .select("students")
        .lean();

      const taughtClassIds = classes.map(
        (c) => c._id as mongoose.Types.ObjectId,
      );
      const roster = new Set<string>();
      for (const c of classes) {
        for (const sid of c.students ?? []) {
          roster.add(sid.toString());
        }
      }

      req.schoolReadScope = {
        kind: "teacher",
        teacherDocId: teacher._id as mongoose.Types.ObjectId,
        rosterStudentIds: [...roster].map(
          (id) => new mongoose.Types.ObjectId(id),
        ),
        taughtClassIds,
      } satisfies SchoolReadScope;
      next();
      return;
    }

    if (student?._id) {
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

      req.schoolReadScope = {
        kind: "student",
        studentDocId: student._id as mongoose.Types.ObjectId,
        classIds: [...classIdSet].map((id) => new mongoose.Types.ObjectId(id)),
      } satisfies SchoolReadScope;
      next();
      return;
    }

    req.schoolReadScope = { kind: "none" } satisfies SchoolReadScope;
    next();
  } catch (err) {
    next(err);
  }
};

export default loadSchoolReadScope;
