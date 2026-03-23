import type { Request, Response, NextFunction } from "express";
import {
  createBookService,
  getAllBooksService,
  getBookByIdService,
  updateBookService,
  deleteBookService,
  borrowBookService,
  returnBookService,
  getAllBorrowsService,
} from "../services/library.service.js";

export const createBook = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const book = await createBookService(req.body);
    res.status(201).json({ success: true, data: book, message: "Book created successfully" });
  } catch (error) {
    next(error);
  }
};

export const getAllBooks = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { category, status, search, page, limit } = req.query;

    const filters: {
      category?: string;
      status?: string;
      search?: string;
      page?: number;
      limit?: number;
    } = {};

    if (category) filters.category = category as string;
    if (status) filters.status = status as string;
    if (search) filters.search = search as string;
    if (page) filters.page = Number(page);
    if (limit) filters.limit = Number(limit);

    const result = await getAllBooksService(filters);
    res.status(200).json({ success: true, data: result, message: "Books fetched successfully" });
  } catch (error) {
    next(error);
  }
};

export const getBookById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    if (!id || Array.isArray(id)) {
      res.status(400).json({ success: false, message: "Book ID is required" });
      return;
    }
    const book = await getBookByIdService(id);
    res.status(200).json({ success: true, data: book, message: "Book fetched successfully" });
  } catch (error) {
    next(error);
  }
};

export const updateBook = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    if (!id || Array.isArray(id)) {
      res.status(400).json({ success: false, message: "Book ID is required" });
      return;
    }
    const book = await updateBookService(id, req.body);
    res.status(200).json({ success: true, data: book, message: "Book updated successfully" });
  } catch (error) {
    next(error);
  }
};

export const deleteBook = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    if (!id || Array.isArray(id)) {
      res.status(400).json({ success: false, message: "Book ID is required" });
      return;
    }
    await deleteBookService(id);
    res.status(200).json({ success: true, data: null, message: "Book deleted successfully" });
  } catch (error) {
    next(error);
  }
};

export const borrowBook = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    if (!id || Array.isArray(id)) {
      res.status(400).json({ success: false, message: "Book ID is required" });
      return;
    }
    const borrow = await borrowBookService(id, req.body);
    res.status(201).json({ success: true, data: borrow, message: "Book borrowed successfully" });
  } catch (error) {
    next(error);
  }
};

export const returnBook = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { borrowId } = req.params;
    if (!borrowId || Array.isArray(borrowId)) {
      res.status(400).json({ success: false, message: "Borrow ID is required" });
      return;
    }
    const { returnDate } = req.body;
    const borrow = await returnBookService(borrowId, returnDate);
    res.status(200).json({ success: true, data: borrow, message: "Book returned successfully" });
  } catch (error) {
    next(error);
  }
};

export const getAllBorrows = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { borrowerId, bookId, status, page, limit } = req.query;

    const filters: {
      borrowerId?: string;
      bookId?: string;
      status?: string;
      page?: number;
      limit?: number;
    } = {};

    if (borrowerId) filters.borrowerId = borrowerId as string;
    if (bookId) filters.bookId = bookId as string;
    if (status) filters.status = status as string;
    if (page) filters.page = Number(page);
    if (limit) filters.limit = Number(limit);

    const result = await getAllBorrowsService(filters);
    res.status(200).json({ success: true, data: result, message: "Borrows fetched successfully" });
  } catch (error) {
    next(error);
  }
};