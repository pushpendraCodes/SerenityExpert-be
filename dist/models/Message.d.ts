import mongoose, { Document, Types } from "mongoose";
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
declare const Message: mongoose.Model<IMessage, {}, {}, {}, mongoose.Document<unknown, {}, IMessage, {}, mongoose.DefaultSchemaOptions> & IMessage & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IMessage>;
export default Message;
//# sourceMappingURL=Message.d.ts.map