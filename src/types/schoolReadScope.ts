import type { Types } from "mongoose";

export type SchoolReadScope =
  | { kind: "admin" }
  | {
      kind: "teacher";
      teacherDocId: Types.ObjectId;
      rosterStudentIds: Types.ObjectId[];
      taughtClassIds: Types.ObjectId[];
    }
  | {
      kind: "student";
      studentDocId: Types.ObjectId;
      classIds: Types.ObjectId[];
    }
  | { kind: "none" };
