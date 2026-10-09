import mongoose, { Document, Schema } from "mongoose";

export const SCHOOL_SITE_SECTIONS = [
  "news",
  "events",
  "academic-calendar",
  "announcements",
  "photo-gallery",
  "video-gallery",
  "about-us",
  "director",
  "staff-members",
  "administration",
  "vision-and-mission",
  "contact",
] as const;

export type SchoolSiteSection = (typeof SCHOOL_SITE_SECTIONS)[number];

export interface ILocalizedText {
  en: string;
  am: string;
}

export interface ISchoolSiteContent extends Document {
  section: SchoolSiteSection;
  title: ILocalizedText;
  summary: ILocalizedText;
  body: ILocalizedText;
  mediaUrl?: string;
  mediaType?: "image" | "video";
  externalUrl?: string;
  location?: string;
  startsAt?: Date;
  endsAt?: Date;
  status: "draft" | "published";
  featured: boolean;
  sortOrder: number;
  publishedAt?: Date;
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const LocalizedTextSchema = new Schema<ILocalizedText>(
  {
    en: { type: String, trim: true, default: "" },
    am: { type: String, trim: true, default: "" },
  },
  { _id: false },
);

const SchoolSiteContentSchema = new Schema<ISchoolSiteContent>(
  {
    section: {
      type: String,
      enum: SCHOOL_SITE_SECTIONS,
      required: true,
      index: true,
    },
    title: { type: LocalizedTextSchema, required: true },
    summary: { type: LocalizedTextSchema, default: () => ({ en: "", am: "" }) },
    body: { type: LocalizedTextSchema, default: () => ({ en: "", am: "" }) },
    mediaUrl: { type: String, trim: true },
    mediaType: { type: String, enum: ["image", "video"] },
    externalUrl: { type: String, trim: true },
    location: { type: String, trim: true },
    startsAt: { type: Date },
    endsAt: { type: Date },
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
      index: true,
    },
    featured: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 },
    publishedAt: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

SchoolSiteContentSchema.index({ section: 1, status: 1, publishedAt: -1, sortOrder: 1 });

export default mongoose.model<ISchoolSiteContent>(
  "SchoolSiteContent",
  SchoolSiteContentSchema,
);
