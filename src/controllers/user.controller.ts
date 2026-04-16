import type { RequestHandler } from "express";
import type { StringValue } from "ms";
import { createUser, changePassword, getMyProfileService, updateProfileService, getAllUsersService, getUserByIdService, requestPasswordResetService, confirmPasswordResetService } from "../services/user.service.js";
import ApiError from "../utils/ApiError.js";
import env from "../config/env.js";
import ms from "ms";
import { updateProfileSchema } from "../validators/user.validator.js";

export const create: RequestHandler = async (req, res, next) => {
  try {
    const result = await createUser(req.body, req);

    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: env.nodeEnv === "production",
      sameSite: "lax",
      maxAge: ms(env.jwtRefreshExpiresIn as StringValue),
    });

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: {
        user: result.user,
        accessToken: result.accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getAllUsers: RequestHandler = async (req, res, next) => {
  try {
    const { search, role, isActive, page, limit } = req.query;

    const filters: {
      search?: string;
      role?: string;
      isActive?: boolean;
      page?: number;
      limit?: number;
    } = {};

    if (search) filters.search = search as string;
    if (role) filters.role = role as string;
    if (isActive !== undefined) filters.isActive = isActive === "true";
    if (page) filters.page = Number(page);
    if (limit) filters.limit = Number(limit);

    const result = await getAllUsersService(filters);

    res.status(200).json({
      success: true,
      data: result,
      message: "Users fetched successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const getUserById: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id || Array.isArray(id)) {
      res.status(400).json({ success: false, message: "User ID is required" });
      return;
    }

    const user = await getUserByIdService(id);

    res.status(200).json({
      success: true,
      data: { user },
      message: "User fetched successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const updatePassword: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      throw new Error("No user attached to request.");
    }

    const { currentPassword, newPassword } = req.body as {
      currentPassword: string;
      newPassword: string;
    };

    const result = await changePassword(
      req.user._id,
      currentPassword,
      newPassword
    );

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (err) {
    next(err);
  }
};

export const getMyProfile: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      throw new ApiError(401, "Unauthorized");
    }

    const user = await getMyProfileService(req.user._id.toString());

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    res.status(200).json({
      success: true,
      message: "Profile fetched successfully",
      data: { user },
    });
  } catch (err) {
    next(err);
  }
};

export const updateProfile: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) throw new ApiError(401, "Unauthorized");

    const input = updateProfileSchema.parse(req.body);
    const user  = await updateProfileService(req.user._id, input);

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data:    { user },
    });
  } catch (err) {
    next(err);
  }
};


export const requestPasswordReset: RequestHandler = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      throw new ApiError(400, "Email is required");
    }

    const result = await requestPasswordResetService(email);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (err) {
    next(err);
  }
};

export const confirmPasswordReset: RequestHandler = async (req, res, next) => {
  try {
    const { resetToken, newPassword } = req.body;

    if (!resetToken || !newPassword) {
      throw new ApiError(400, "Reset token and new password are required");
    }

    const result = await confirmPasswordResetService(resetToken, newPassword);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (err) {
    next(err);
  }
};
