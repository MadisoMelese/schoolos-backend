import mongoose, { Document, Schema } from "mongoose";

export interface IAttendance extends Document {
  studentId: mongoose.Types.ObjectId;
  classId: mongoose.Types.ObjectId;
  teacherId: mongoose.Types.ObjectId;
  date: Date;
  status: "present" | "absent" | "late" | "excused";
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AttendanceSchema = new Schema<IAttendance>(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    classId: {
      type: Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },
    teacherId: {
      type: Schema.Types.ObjectId,
      ref: "Teacher",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["present", "absent", "late", "excused"],
      required: true,
    },
    note: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

// Indexes for attendance queries
AttendanceSchema.index({ studentId: 1, classId: 1, date: 1 }, { unique: true });
AttendanceSchema.index({ teacherId: 1, date: -1 });
AttendanceSchema.index({ classId: 1, date: -1 });
AttendanceSchema.index({ studentId: 1, date: -1 });

export default mongoose.model<IAttendance>("Attendance", AttendanceSchema);