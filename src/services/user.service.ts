import type { Types } from "mongoose";
import type { Request } from "express";
import User from "../models/User.model.js";
import Session from "../models/Session.model.js";
import type { IUserDocument } from "../models/User.model.js";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt.js";
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