import mongoose, { Schema, Document, Types } from "mongoose";

export interface ICommunityQuestion extends Document {
  _id: Types.ObjectId;
  authorId: Types.ObjectId;
  authorName: string;
  isAnonymous: boolean;
  title: string;
  slug?: string;
  body: string;
  category: Types.ObjectId;
  tags: string[];
  likes: Types.ObjectId[];
  likesCount: number;
  commentsCount: number;
  isModerated: boolean;
  isFlagged: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const communityQuestionSchema = new Schema<ICommunityQuestion>(
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
    },
    isAnonymous: {
      type: Boolean,
      default: false,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300,
    },
    slug: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
      trim: true,
    },
    body: {
      type: String,
      required: true,
      maxlength: 5000,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      index: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    likes: [{
      type: Schema.Types.ObjectId,
      ref: "User",
    }],
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

communityQuestionSchema.index({ createdAt: -1 });
communityQuestionSchema.index({ isFlagged: 1 });
communityQuestionSchema.index({ title: "text", body: "text" });

const CommunityQuestion = mongoose.model<ICommunityQuestion>("CommunityQuestion", communityQuestionSchema);
export default CommunityQuestion;
