import mongoose, { Schema, Document, Types } from "mongoose";
import { ChatStatus } from "../types/index.js";

export interface IChat extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  expertId: Types.ObjectId;
  status: ChatStatus;
  lastMessage?: string;
  lastMessageAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const chatSchema = new Schema<IChat>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    expertId: {
      type: Schema.Types.ObjectId,
      ref: "Expert",
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(ChatStatus),
      default: ChatStatus.ACTIVE,
    },
    lastMessage: String,
    lastMessageAt: Date,
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

// Compound index to ensure one chat per user-expert pair
chatSchema.index({ userId: 1, expertId: 1 }, { unique: true });
chatSchema.index({ userId: 1, updatedAt: -1 });
chatSchema.index({ expertId: 1, updatedAt: -1 });

const Chat = mongoose.model<IChat>("Chat", chatSchema);
export default Chat;
