import mongoose, { Schema, Document, Types } from "mongoose";

export interface ICommunityComment extends Document {
  _id: Types.ObjectId;
  questionId: Types.ObjectId;
  authorId: Types.ObjectId;
  authorRole: "user" | "expert";
  body: string;
  parentCommentId?: Types.ObjectId;
  likes: Types.ObjectId[];
  likesCount: number;
  isModerated: boolean;
  isFlagged: boolean;
  isDeleted: boolean;
  createdAt: Date;
}

const communityCommentSchema = new Schema<ICommunityComment>(
  {
    questionId: {
      type: Schema.Types.ObjectId,
      ref: "CommunityQuestion",
      required: true,
      index: true,
    },
    authorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    authorRole: {
      type: String,
      enum: ["user", "expert"],
      default: "user",
    },
    body: {
      type: String,
      required: true,
      maxlength: 2000,
    },
    parentCommentId: {
      type: Schema.Types.ObjectId,
      ref: "CommunityComment",
    },
    likes: [{
      type: Schema.Types.ObjectId,
      ref: "User",
    }],
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

communityCommentSchema.index({ questionId: 1, createdAt: 1 });

const CommunityComment = mongoose.model<ICommunityComment>("CommunityComment", communityCommentSchema);
export default CommunityComment;
