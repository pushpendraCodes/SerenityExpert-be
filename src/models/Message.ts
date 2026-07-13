import mongoose, { Schema, Document, Types } from "mongoose";
import { MessageType } from "../types/index.js";

export interface IMessage extends Document {
  _id: Types.ObjectId;
  chatId: Types.ObjectId;
  senderId: Types.ObjectId;
  senderRole: "user" | "expert";
  content: string;
  messageType: MessageType;
  imageUrl?: string;
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    chatId: {
      type: Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
      index: true,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    senderRole: {
      type: String,
      enum: ["user", "expert"],
      required: true,
    },
    content: {
      type: String,
      default: "",
      maxlength: 5000,
    },
    messageType: {
      type: String,
      enum: Object.values(MessageType),
      default: MessageType.TEXT,
    },
    imageUrl: String,
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: Date,
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

// Compound index for efficient chat message queries
messageSchema.index({ chatId: 1, createdAt: -1 });

const Message = mongoose.model<IMessage>("Message", messageSchema);
export default Message;
