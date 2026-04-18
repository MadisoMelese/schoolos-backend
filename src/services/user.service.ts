import type { Types } from "mongoose";
import type { Request } from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.model.js";
import Session from "../models/Session.model.js";
import type { IUserDocument } from "../models/User.model.js";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt.js";
import { sendPasswordResetEmail } from "../utils/emailService.js";
import ApiError from "../utils/ApiError.js";
import ms from "ms";
import type { StringValue } from "ms";
import env from "../config/env.js";
import type { UpdateProfileInput } from "../validators/user.validator.js";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CreateUserData {
  firstname: string;
  lastname: string;
  username: string;
  email: string;
  password: string;
  birthday?: Date;
  gender?: string;
  location?: {
    city?: string;
    country?: string;
  };
  avatar?: string;
}

interface CreateUserResult {
  user: IUserDocument;
  accessToken: string;
  refreshToken: string;
}

interface ChangePasswordResult {
  message: string;
}

// ─── Service Functions ────────────────────────────────────────────────────────

export const createUser = async (
  userData: CreateUserData,
  req: Request,
): Promise<CreateUserResult> => {
  const { firstname, lastname, username, email, password, birthday, gender, location, avatar } =
    userData;

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new ApiError(400, "Email already registered");
  }

  const user = await User.create({
    firstname,
    lastname,
    username,
    email,
    password,
    ...(birthday && { birthday }),
    ...(gender && { gender }),
    ...(location && { location }),
    ...(avatar && { avatar }),
  });

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  const session = new Session({
    user: user._id,
    userAgent: req.headers["user-agent"],
    ip: req.ip,
    expiresAt: new Date(Date.now() + ms(env.jwtRefreshExpiresIn as StringValue)),
  });

  session.setRefreshToken(refreshToken);
  await session.save();

  return { user, accessToken, refreshToken };
};

export const getAllUsersService = async (filters: {
  search?: string;
  role?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}) => {
  const { search, role, isActive, page = 1, limit = 20 } = filters;

  const query: Record<string, unknown> = {};

  if (search) {
    query.$or = [
      { firstname: { $regex: search, $options: "i" } },
      { lastname: { $regex: search, $options: "i" } },
      { username: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  if (role) query.role = role;
  if (isActive !== undefined) query.isActive = isActive;

  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    User.find(query)
      .select("-password")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }),
    User.countDocuments(query),
  ]);

  return {
    users,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
};

export const getUserByIdService = async (id: string) => {
  const user = await User.findById(id).select("-password");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return user;
}; 

export const changePassword = async (
  userId: Types.ObjectId,
  currentPassword: string,
  newPassword: string,
): Promise<ChangePasswordResult> => {
  const user = await User.findById(userId).select("+password");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const isMatch = await user.comparePassword(currentPassword);

  if (!isMatch) {
    throw new ApiError(401, "Current password is incorrect");
  }

  user.password = newPassword;
  user.tokenVersion += 1;

  await user.save();

  await Session.deleteMany({ user: userId });

  return { message: "Password changed successfully. Please login again." };
};

export const getMyProfileService = async (userId: string) => {
  const user = await User.findById(userId).select("-password");

  if (!user) return null;

  return user;
};

export const updateProfileService = async (
  userId: Types.ObjectId,
  input: UpdateProfileInput,
): Promise<IUserDocument> => {
  const user = await User.findById(userId);

  if (!user) throw new ApiError(404, "User not found");

  if (input.username && input.username !== user.username) {
    const taken = await User.findOne({ username: input.username });
    if (taken) throw new ApiError(409, "Username already taken");
  }

  Object.assign(user, {
    ...(input.firstname && { firstname: input.firstname }),
    ...(input.lastname  && { lastname:  input.lastname  }),
    ...(input.username  && { username:  input.username  }),
    ...(input.avatar    && { avatar:    input.avatar    }),
    ...(input.birthday  && { birthday:  new Date(input.birthday) }),
    ...(input.gender    && { gender:    input.gender    }),
  });

  await user.save();
  return user;
};


export const requestPasswordResetService = async (email: string): Promise<{ message: string }> => {
  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    // Don't reveal if email exists for security reasons
    return { message: "If an account exists with this email, a password reset link will be sent." };
  }

  // Generate reset token (32 character random string)
  const resetToken = Math.random().toString(36).substring(2, 15) + 
                     Math.random().toString(36).substring(2, 15) +
                     Math.random().toString(36).substring(2, 15);
  
  // Hash the token for storage
  const hashedToken = await bcrypt.hash(resetToken, 10);
  
  // Set token and expiry (1 hour)
  user.passwordResetToken = hashedToken;
  user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
  
  await user.save();

  // Send password reset email
  await sendPasswordResetEmail(user.email, resetToken, user.firstname);

  return { message: "If an account exists with this email, a password reset link will be sent." };
};

export const confirmPasswordResetService = async (
  resetToken: string,
  newPassword: string,
): Promise<{ message: string }> => {
  // Find user with matching reset token
  const users = await User.find().select("+password");
  
  let user: IUserDocument | null = null;
  for (const u of users) {
    if (u.passwordResetToken && await bcrypt.compare(resetToken, u.passwordResetToken)) {
      user = u;
      break;
    }
  }

  if (!user) {
    throw new ApiError(400, "Invalid or expired reset token");
  }

  // Check if token has expired
  if (!user.passwordResetExpires || user.passwordResetExpires < new Date()) {
    throw new ApiError(400, "Reset token has expired");
  }

  // Hash the new password manually
  const hashedPassword = await bcrypt.hash(newPassword, 12);

  // Update user with hashed password using updateOne (bypasses pre-save middleware)
  await User.updateOne(
    { _id: user._id },
    {
      $set: {
        password: hashedPassword,
        passwordChangedAt: new Date(),
        tokenVersion: user.tokenVersion + 1,
      },
      $unset: {
        passwordResetToken: "",
        passwordResetExpires: "",
      },
    }
  );

  // Clear all sessions for this user
  await Session.deleteMany({ user: user._id });

  return { message: "Password reset successfully. Please login with your new password." };
};
