import mongoose, { Document, Schema } from "mongoose";

export interface IExam extends Document {
  title: string;
  description?: string;
  classId: mongoose.Types.ObjectId;
  subject: string;
  teacherId: mongoose.Types.ObjectId;
  date: Date;
  startTime: string;
  endTime: string;
  totalMarks: number;
  passingMarks: number;
  academicYear: string;
  status: "scheduled" | "ongoing" | "completed" | "cancelled";
  createdAt: Date;
  updatedAt: Date;
}

const ExamSchema = new Schema<IExam>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    classId: {
      type: Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
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
    startTime: {
      type: String,
      required: true,
      trim: true,
    },
    endTime: {
      type: String,
      required: true,
      trim: true,
    },
    totalMarks: {
      type: Number,
      required: true,
      min: 1,
    },
    passingMarks: {
      type: Number,
      required: true,
      min: 1,
    },
    academicYear: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["scheduled", "ongoing", "completed", "cancelled"],
      default: "scheduled",
    },
  },
  { timestamps: true }
);

export default mongoose.model<IExam>("Exam", ExamSchema);