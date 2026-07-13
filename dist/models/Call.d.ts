import mongoose, { Document, Types } from "mongoose";
import { CallStatus } from "../types/index.js";
export interface ICall extends Document {
    _id: Types.ObjectId;
    userId: Types.ObjectId;
    expertId: Types.ObjectId;
    agoraChannelName?: string;
    status: CallStatus;
    startedAt?: Date;
    endedAt?: Date;
    durationSeconds: number;
    totalCost: number;
    pricePerMinute: number;
    recordingUrl?: string;
    rating?: number;
    review?: string;
    endReason?: "completed" | "low_balance" | "expert_ended" | "user_ended" | "missed" | "rejected" | "force_ended";
    createdAt: Date;
    updatedAt: Date;
}
declare const Call: mongoose.Model<ICall, {}, {}, {}, mongoose.Document<unknown, {}, ICall, {}, mongoose.DefaultSchemaOptions> & ICall & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, ICall>;
export default Call;
//# sourceMappingURL=Call.d.ts.map