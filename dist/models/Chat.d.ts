import mongoose, { Document, Types } from "mongoose";
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
declare const Chat: mongoose.Model<IChat, {}, {}, {}, mongoose.Document<unknown, {}, IChat, {}, mongoose.DefaultSchemaOptions> & IChat & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IChat>;
export default Chat;
//# sourceMappingURL=Chat.d.ts.map