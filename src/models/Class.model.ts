import mongoose, { Document, Schema } from "mongoose";

export interface IClass extends Document {
  name: string;
  section: string;
  grade: string;
  teacherId?: mongoose.Types.ObjectId;
  students?: mongoose.Types.ObjectId[];
  capacity: number;
  academicYear: string;
  status: "active" | "inactive";
  createdAt: Date;
  updatedAt: Date;
}

const ClassSchema = new Schema<IClass>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    section: {
      type: String,
      required: true,
      trim: true,
    },
    grade: {
      type: String,
      required: true,
      trim: true,
    },
    teacherId: {
      type: Schema.Types.ObjectId,
      ref: "Teacher",
    },
    students: [
      {
        type: Schema.Types.ObjectId,
        ref: "Student",
      },
    ],
    capacity: {
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
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true }
);

export default mongoose.model<IClass>("Class", ClassSchema);