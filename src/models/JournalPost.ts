import mongoose, { Schema, Document, Types } from "mongoose";
import { JournalVisibility, JournalMediaType } from "../types/index.js";

export interface IJournalMediaItem {
  url: string;
  publicId: string;
  resourceType: "image" | "video";
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  durationSec?: number;
  bytes?: number;
}

export interface IJournalPost extends Document {
  _id: Types.ObjectId;
  authorId: Types.ObjectId;
  authorName: string;
  body: string;
  visibility: JournalVisibility;
  mediaType: JournalMediaType;
  media: IJournalMediaItem[];
  likes: Types.ObjectId[];
  likesCount: number;
  commentsCount: number;
  isModerated: boolean;
  isFlagged: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const mediaItemSchema = new Schema<IJournalMediaItem>(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    resourceType: { type: String, enum: ["image", "video"], required: true },
    thumbnailUrl: { type: String },
    width: { type: Number },
    height: { type: Number },
    durationSec: { type: Number },
    bytes: { type: Number },
  },
  { _id: false }
);

const journalPostSchema = new Schema<IJournalPost>(
  {
    authorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    authorName: {
      type: String,
      required: true,
      trim: true,
    },
    body: {
      type: String,
      default: "",
      maxlength: 5000,
      trim: true,
    },
    visibility: {
      type: String,
      enum: Object.values(JournalVisibility),
      required: true,
      index: true,
    },
    mediaType: {
      type: String,
      enum: Object.values(JournalMediaType),
      default: JournalMediaType.NONE,
      index: true,
    },
    media: {
      type: [mediaItemSchema],
      default: [],
    },
    likes: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    likesCount: {
      type: Number,
      default: 0,
    },
    commentsCount: {
      type: Number,
      default: 0,
    },
    isModerated: {
      type: Boolean,
      default: false,
    },
    isFlagged: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        Reflect.deleteProperty(ret, "__v");
        return ret;
      },
    },
  }
);

journalPostSchema.index({ createdAt: -1 });
journalPostSchema.index({ authorId: 1, visibility: 1, createdAt: -1 });
journalPostSchema.index({ visibility: 1, createdAt: -1 });
journalPostSchema.index({ isFlagged: 1 });
journalPostSchema.index({ body: "text" });

const JournalPost = mongoose.model<IJournalPost>("JournalPost", journalPostSchema);
export default JournalPost;
