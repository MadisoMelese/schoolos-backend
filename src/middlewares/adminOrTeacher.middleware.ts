import type { RequestHandler } from "express";
import ApiError from "../utils/ApiError.js";

// ─── Admin or Teacher Only ─────────────────────────────────────────────────────
// Must be used AFTER protect middleware — requires req.user to be set
// Allows access to both admins and teachers (e.g., for marking attendance)

const adminOrTeacher: RequestHandler = (req, _res, next) => {
  if (!req.user) {
    throw new ApiError(401, "Unauthorized");
  }

  if (req.user.role !== "admin" && req.user.role !== "teacher") {
    throw new ApiError(403, "Access denied. Admins or teachers only.");
  }

  next();
};

export default adminOrTeacher;
