import mongoose, { Document, Schema } from "mongoose";

export interface IBookBorrow extends Document {
  bookId: mongoose.Types.ObjectId;
  borrowerId: mongoose.Types.ObjectId;
  borrowerType: "student" | "teacher";
  borrowDate: Date;
  dueDate: Date;
  returnDate?: Date;
  status: "borrowed" | "returned" | "overdue";
  createdAt: Date;
  updatedAt: Date;
}

const BookBorrowSchema = new Schema<IBookBorrow>(
  {
    bookId: {
      type: Schema.Types.ObjectId,
      ref: "Book",
      required: true,
    },
    borrowerId: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: "borrowerType",
    },
    borrowerType: {
      type: String,
      enum: ["student", "teacher"],
      required: true,
    },
    borrowDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    returnDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["borrowed", "returned", "overdue"],
      default: "borrowed",
    },
  },
  { timestamps: true }
);

export default mongoose.model<IBookBorrow>("BookBorrow", BookBorrowSchema);