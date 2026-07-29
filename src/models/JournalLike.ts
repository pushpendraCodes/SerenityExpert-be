import mongoose, { Schema, Document, Types } from "mongoose";

export interface IJournalLike extends Document {
  _id: Types.ObjectId;
  postId: Types.ObjectId;
  userId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const journalLikeSchema = new Schema<IJournalLike>(
  {
    postId: {
      type: Schema.Types.ObjectId,
      ref: "JournalPost",
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

journalLikeSchema.index({ postId: 1, userId: 1 }, { unique: true });

const JournalLike = mongoose.model<IJournalLike>("JournalLike", journalLikeSchema);
export default JournalLike;
