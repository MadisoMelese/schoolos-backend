import type { RequestHandler } from "express";
import User from "../models/User.model.js";
import ApiError from "../utils/ApiError.js";
import bcrypt from "bcryptjs";

/**
 * Admin Controller
 * Handles admin-specific operations for user management
 */

// Get all users with filtering
export const getAllUsers: RequestHandler = async (req, res, next) => {
  try {
    const { search, role, isActive, page = 1, limit = 20 } = req.query;

    const query: Record<string, unknown> = {};

    if (search) {
      query.$or = [
        { firstname: { $regex: search, $options: "i" } },
        { lastname: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === "true";

    const skip = (Number(page) - 1) * Number(limit);

    const [users, total] = await Promise.all([
      User.find(query)
        .select("-password")
        .skip(skip)
        .limit(Number(limit))
        .sort({ createdAt: -1 }),
      User.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: {
        users,
        total,
        page: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
      },
      message: "Users fetched successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Get user by ID
export const getUserById: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id || Array.isArray(id)) {
      res.status(400).json({ success: false, message: "User ID is required" });
      return;
    }

    const user = await User.findById(id).select("-password");

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    res.status(200).json({
      success: true,
      data: { user },
      message: "User fetched successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Create new user
export const createUser: RequestHandler = async (req, res, next) => {
  try {
    const { email, name, role, password } = req.body;

    // Validate required fields
    if (!email || !name || !role) {
      throw new ApiError(400, "Email, name, and role are required");
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw new ApiError(400, "User with this email already exists");
    }

    // Split name into firstname and lastname
    const nameParts = name.trim().split(/\s+/);
    const firstname = nameParts[0];
    const lastname = nameParts.slice(1).join(" ") || "";

    // Generate username from email
    const username = email.split("@")[0];

    // Generate temporary password if not provided
    const temporaryPassword = password || Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(temporaryPassword, 12);

    // Create user
    const user = await User.create({
      firstname,
      lastname,
      username,
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
      isActive: true,
    });

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user._id,
          firstname: user.firstname,
          lastname: user.lastname,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          createdAt: user.createdAt,
        },
        temporaryPassword: password ? undefined : temporaryPassword,
      },
      message: "User created successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Update user
export const updateUser: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, role, status } = req.body;

    if (!id || Array.isArray(id)) {
      res.status(400).json({ success: false, message: "User ID is required" });
      return;
    }

    const updateData: Record<string, unknown> = {};

    if (name) {
      const nameParts = name.trim().split(/\s+/);
      updateData.firstname = nameParts[0];
      updateData.lastname = nameParts.slice(1).join(" ") || "";
    }

    if (role) updateData.role = role;
    if (status !== undefined) updateData.isActive = status === "active";

    const user = await User.findByIdAndUpdate(id, updateData, {
      returnDocument: "after",
      runValidators: true,
    }).select("-password");

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    res.status(200).json({
      success: true,
      data: { user },
      message: "User updated successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Block user
export const blockUser: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!id || Array.isArray(id)) {
      res.status(400).json({ success: false, message: "User ID is required" });
      return;
    }

    const user = await User.findByIdAndUpdate(
      id,
      {
        isActive: false,
        blockedReason: reason,
        blockedAt: new Date(),
      },
      { returnDocument: "after" }
    ).select("-password");

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    res.status(200).json({
      success: true,
      message: "User blocked successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Unblock user
export const unblockUser: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id || Array.isArray(id)) {
      res.status(400).json({ success: false, message: "User ID is required" });
      return;
    }

    const user = await User.findByIdAndUpdate(
      id,
      {
        isActive: true,
        $unset: { blockedReason: "", blockedAt: "" },
      },
      { returnDocument: "after" }
    ).select("-password");

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    res.status(200).json({
      success: true,
      message: "User unblocked successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Delete user
export const deleteUser: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id || Array.isArray(id)) {
      res.status(400).json({ success: false, message: "User ID is required" });
      return;
    }

    const user = await User.findByIdAndDelete(id);

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Get dashboard stats
export const getDashboardStats: RequestHandler = async (req, res, next) => {
  try {
    const [totalUsers, activeUsers, totalStudents, totalTeachers, totalParents] =
      await Promise.all([
        User.countDocuments(),
        User.countDocuments({ isActive: true }),
        User.countDocuments({ role: "student" }),
        User.countDocuments({ role: "teacher" }),
        User.countDocuments({ role: "parent" }),
      ]);

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        totalStudents,
        totalTeachers,
        totalParents,
        recentActivity: [],
      },
      message: "Dashboard stats fetched successfully",
    });
  } catch (error) {
    next(error);
  }
};
