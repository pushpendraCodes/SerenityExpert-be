import mongoose, { Schema, Document, Types } from "mongoose";

export type StoryMediaKind = "image" | "video";

export interface IStory extends Document {
  _id: Types.ObjectId;
  authorId: Types.ObjectId;
  authorName: string;
  authorAvatar?: string;
  mediaUrl: string;
  publicId: string;
  mediaType: StoryMediaKind;
  thumbnailUrl?: string;
  caption?: string;
  durationSec?: number;
  viewers: Types.ObjectId[];
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const storySchema = new Schema<IStory>(
  {
    authorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    authorName: { type: String, required: true, trim: true },
    authorAvatar: { type: String, default: "" },
    mediaUrl: { type: String, required: true },
    publicId: { type: String, required: true },
    mediaType: { type: String, enum: ["image", "video"], required: true },
    thumbnailUrl: { type: String },
    caption: { type: String, maxlength: 300, trim: true, default: "" },
    durationSec: { type: Number },
    viewers: [{ type: Schema.Types.ObjectId, ref: "User" }],
    expiresAt: { type: Date, required: true, index: true },
  },
  { timestamps: true }
);

storySchema.index({ authorId: 1, expiresAt: 1 });
storySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL — auto-delete from Mongo

const Story = mongoose.model<IStory>("Story", storySchema);
export default Story;
