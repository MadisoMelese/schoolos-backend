import { Router } from "express";
import type { RequestHandler } from "express";
import protect from "../middlewares/auth.middleware.js";
import authorize from "../middlewares/role.middleware.js";
import adminOnly from "../middlewares/adminOnly.middleware.js";
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  blockUser,
  unblockUser,
  deleteUser,
  getDashboardStats,
} from "../controllers/admin.controller.js";

const router = Router();

// All admin routes require authentication and admin role
router.use(protect);
router.use(adminOnly);

// Dashboard stats
router.get("/dashboard/stats", getDashboardStats);

// User management routes
router.get("/users", getAllUsers);
router.get("/users/:id", getUserById);
router.post("/users", createUser);
router.put("/users/:id", updateUser);
router.post("/users/:id/block", blockUser);
router.post("/users/:id/unblock", unblockUser);
router.delete("/users/:id", deleteUser);

export default router;