import mongoose, { Schema, Document, Types } from "mongoose";

export interface IJournalComment extends Document {
  _id: Types.ObjectId;
  postId: Types.ObjectId;
  authorId: Types.ObjectId;
  authorName: string;
  body: string;
  parentCommentId?: Types.ObjectId;
  likes: Types.ObjectId[];
  likesCount: number;
  isModerated: boolean;
  isFlagged: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const journalCommentSchema = new Schema<IJournalComment>(
  {
    postId: {
      type: Schema.Types.ObjectId,
      ref: "JournalPost",
      required: true,
      index: true,
    },
    authorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    authorName: {
      type: String,
      required: true,
      trim: true,
    },
    body: {
      type: String,
      required: true,
      maxlength: 2000,
      trim: true,
    },
    parentCommentId: {
      type: Schema.Types.ObjectId,
      ref: "JournalComment",
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

journalCommentSchema.index({ postId: 1, createdAt: 1 });

const JournalComment = mongoose.model<IJournalComment>("JournalComment", journalCommentSchema);
export default JournalComment;
