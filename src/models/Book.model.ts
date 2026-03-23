import mongoose, { Document, Schema } from "mongoose";

export interface IBook extends Document {
  title: string;
  author: string;
  isbn?: string;
  category: string;
  totalCopies: number;
  availableCopies: number;
  description?: string;
  publishedYear?: number;
  status: "available" | "unavailable";
  createdAt: Date;
  updatedAt: Date;
}

const BookSchema = new Schema<IBook>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    author: {
      type: String,
      required: true,
      trim: true,
    },
    isbn: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    totalCopies: {
      type: Number,
      required: true,
      min: 1,
    },
    availableCopies: {
      type: Number,
      required: true,
      min: 0,
    },
    description: {
      type: String,
      trim: true,
    },
    publishedYear: {
      type: Number,
    },
    status: {
      type: String,
      enum: ["available", "unavailable"],
      default: "available",
    },
  },
  { timestamps: true }
);

export default mongoose.model<IBook>("Book", BookSchema);