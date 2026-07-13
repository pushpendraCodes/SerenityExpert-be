import mongoose, { Document, Types } from "mongoose";
import { NotificationType } from "../types/index.js";
export interface INotification extends Document {
    _id: Types.ObjectId;
    userId: Types.ObjectId;
    title: string;
    body: string;
    type: NotificationType;
    data?: Record<string, unknown>;
    isRead: boolean;
    readAt?: Date;
    createdAt: Date;
}
declare const Notification: mongoose.Model<INotification, {}, {}, {}, mongoose.Document<unknown, {}, INotification, {}, mongoose.DefaultSchemaOptions> & INotification & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, INotification>;
export default Notification;
//# sourceMappingURL=Notification.d.ts.map