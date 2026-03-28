import { Router } from "express";
import {
  createBook,
  getAllBooks,
  getBookById,
  updateBook,
  deleteBook,
  borrowBook,
  returnBook,
  getAllBorrows,
} from "../controllers/library.controller.js";
import protect from "../middlewares/auth.middleware.js";
import loadSchoolReadScope from "../middlewares/schoolReadScope.middleware.js";
import adminOnly from "../middlewares/adminOnly.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import {
  createBookSchema,
  updateBookSchema,
  borrowBookSchema,
  returnBookSchema,
} from "../validators/library.validator.js";

const router = Router();

router.use(protect);
router.use(loadSchoolReadScope);

router.get("/books", getAllBooks);
router.get("/books/:id", getBookById);
router.get("/borrows", getAllBorrows);

router.post("/books", adminOnly, validate(createBookSchema), createBook);
router.put("/books/:id", adminOnly, validate(updateBookSchema), updateBook);
router.delete("/books/:id", adminOnly, deleteBook);

router.post("/books/:id/borrow", adminOnly, validate(borrowBookSchema), borrowBook);
router.patch("/borrows/:borrowId/return", adminOnly, validate(returnBookSchema), returnBook);

export default router;