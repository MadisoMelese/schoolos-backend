import mongoose from "mongoose";
import SchoolSiteContent from "../models/SchoolSiteContent.model.js";
import type {
  ISchoolSiteContent,
  SchoolSiteSection,
} from "../models/SchoolSiteContent.model.js";
import type { IUserDocument } from "../models/User.model.js";
import ApiError from "../utils/ApiError.js";

export interface SchoolSiteContentFilters {
  section?: SchoolSiteSection;
  status?: "draft" | "published";
  page: number;
  limit: number;
}

type SchoolSiteContentUpdate = Partial<ISchoolSiteContent> & {
  mediaType?: "image" | "video" | null;
  startsAt?: Date | null;
  endsAt?: Date | null;
};

export const getPublicSchoolSiteContent = async (
  section: SchoolSiteSection,
  page: number,
  limit: number,
) => {
  const now = new Date();
  const query = {
    section,
    status: "published",
    $or: [{ publishedAt: { $exists: false } }, { publishedAt: { $lte: now } }],
  };
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    SchoolSiteContent.find(query)
      .select("-createdBy -updatedBy -__v")
      .sort({ sortOrder: 1, publishedAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    SchoolSiteContent.countDocuments(query),
  ]);

  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

export const getAdminSchoolSiteContent = async (
  filters: SchoolSiteContentFilters,
) => {
  const query: Record<string, unknown> = {};
  if (filters.section) query.section = filters.section;
  if (filters.status) query.status = filters.status;
  const skip = (filters.page - 1) * filters.limit;

  const [items, total] = await Promise.all([
    SchoolSiteContent.find(query)
      .sort({ section: 1, sortOrder: 1, updatedAt: -1 })
      .skip(skip)
      .limit(filters.limit)
      .lean(),
    SchoolSiteContent.countDocuments(query),
  ]);

  return {
    items,
    total,
    page: filters.page,
    limit: filters.limit,
    totalPages: Math.ceil(total / filters.limit),
  };
};

export const createSchoolSiteContent = async (
  input: Partial<ISchoolSiteContent>,
  actor: IUserDocument,
) => {
  const now = new Date();
  const content = await SchoolSiteContent.create({
    ...input,
    createdBy: actor._id,
    updatedBy: actor._id,
    ...(input.status === "published" ? { publishedAt: now } : {}),
  });
  return content;
};

export const updateSchoolSiteContent = async (
  id: string,
  input: SchoolSiteContentUpdate,
  actor: IUserDocument,
) => {
  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(400, "Invalid school content ID.");
  }

  const existing = await SchoolSiteContent.findById(id);
  if (!existing) throw new ApiError(404, "School content not found.");

  if (input.section !== undefined) existing.section = input.section;
  if (input.title !== undefined) existing.title = { ...existing.title, ...input.title };
  if (input.summary !== undefined) existing.summary = { ...existing.summary, ...input.summary };
  if (input.body !== undefined) existing.body = { ...existing.body, ...input.body };
  if (input.mediaUrl !== undefined) existing.set("mediaUrl", input.mediaUrl || undefined);
  if (input.mediaType !== undefined) existing.set("mediaType", input.mediaType ?? undefined);
  if (input.externalUrl !== undefined) existing.set("externalUrl", input.externalUrl || undefined);
  if (input.location !== undefined) existing.location = input.location;
  if (input.startsAt !== undefined) existing.set("startsAt", input.startsAt ?? undefined);
  if (input.endsAt !== undefined) existing.set("endsAt", input.endsAt ?? undefined);
  if (input.featured !== undefined) existing.featured = input.featured;
  if (input.sortOrder !== undefined) existing.sortOrder = input.sortOrder;
  if (input.status !== undefined) {
    existing.status = input.status;
    if (input.status === "published" && !existing.publishedAt) {
      existing.publishedAt = new Date();
    }
  }
  const startsAt = input.startsAt === undefined ? existing.startsAt : input.startsAt;
  const endsAt = input.endsAt === undefined ? existing.endsAt : input.endsAt;
  if (startsAt && endsAt && endsAt < startsAt) {
    throw new ApiError(400, "End date must be after the start date.");
  }
  existing.updatedBy = actor._id;

  await existing.save();
  return existing;
};

export const deleteSchoolSiteContent = async (id: string) => {
  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(400, "Invalid school content ID.");
  }
  const content = await SchoolSiteContent.findByIdAndDelete(id);
  if (!content) throw new ApiError(404, "School content not found.");
};
