import { z } from "zod";
import { SCHOOL_SITE_SECTIONS } from "../models/SchoolSiteContent.model.js";

const localizedText = z.object({
  en: z.string().max(20000).optional(),
  am: z.string().max(20000).optional(),
});

const contentFields = {
  section: z.enum(SCHOOL_SITE_SECTIONS),
  title: localizedText,
  summary: localizedText.optional(),
  body: localizedText.optional(),
  mediaUrl: z.string().url().max(2048).optional().or(z.literal("")),
  mediaType: z.enum(["image", "video"]).optional(),
  externalUrl: z.string().url().max(2048).optional().or(z.literal("")),
  location: z.string().max(300).optional(),
  startsAt: z.coerce.date().optional(),
  endsAt: z.coerce.date().optional(),
  status: z.enum(["draft", "published"]).optional(),
  featured: z.boolean().optional(),
  sortOrder: z.number().int().min(-10000).max(10000).optional(),
};

export const createSchoolSiteContentSchema = z.object(contentFields).superRefine(
  (content, context) => {
    if (!content.title.en?.trim() && !content.title.am?.trim()) {
      context.addIssue({
        code: "custom",
        path: ["title"],
        message: "A title in English or Amharic is required.",
      });
    }
    if (content.startsAt && content.endsAt && content.endsAt < content.startsAt) {
      context.addIssue({
        code: "custom",
        path: ["endsAt"],
        message: "End date must be after the start date.",
      });
    }
  },
);

export const updateSchoolSiteContentSchema = z.object({
  section: z.enum(SCHOOL_SITE_SECTIONS).optional(),
  title: localizedText.optional(),
  summary: localizedText.optional(),
  body: localizedText.optional(),
  mediaUrl: z.string().url().max(2048).optional().or(z.literal("")),
  mediaType: z.enum(["image", "video"]).nullable().optional(),
  externalUrl: z.string().url().max(2048).optional().or(z.literal("")),
  location: z.string().max(300).optional(),
  startsAt: z.coerce.date().nullable().optional(),
  endsAt: z.coerce.date().nullable().optional(),
  status: z.enum(["draft", "published"]).optional(),
  featured: z.boolean().optional(),
  sortOrder: z.number().int().min(-10000).max(10000).optional(),
}).superRefine((content, context) => {
  if (content.title && !content.title.en?.trim() && !content.title.am?.trim()) {
    context.addIssue({
      code: "custom",
      path: ["title"],
      message: "A title in English or Amharic is required.",
    });
  }
  if (content.startsAt && content.endsAt && content.endsAt < content.startsAt) {
    context.addIssue({
      code: "custom",
      path: ["endsAt"],
      message: "End date must be after the start date.",
    });
  }
});

export const schoolSiteListQuerySchema = z.object({
  section: z.enum(SCHOOL_SITE_SECTIONS).optional(),
  status: z.enum(["draft", "published"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const schoolSiteSectionSchema = z.enum(SCHOOL_SITE_SECTIONS);
