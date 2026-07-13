import mongoose, { Document, Types } from "mongoose";
import { ExpertStatus } from "../types/index.js";
import type { AvailabilitySlot, BankDetails } from "../types/index.js";
export interface IExpert extends Document {
    _id: Types.ObjectId;
    userId: Types.ObjectId;
    bio: string;
    experience: number;
    categories: Types.ObjectId[];
    languages: string[];
    pricePerMinute: number;
    rating: number;
    totalRatings: number;
    totalCalls: number;
    totalMinutes: number;
    totalEarnings: number;
    status: ExpertStatus;
    availabilitySchedule: AvailabilitySlot[];
    isVerified: boolean;
    isApproved: boolean;
    rejectionReason?: string;
    bankDetails?: BankDetails;
    commissionPercent: number;
    createdAt: Date;
    updatedAt: Date;
}
declare const Expert: mongoose.Model<IExpert, {}, {}, {}, mongoose.Document<unknown, {}, IExpert, {}, mongoose.DefaultSchemaOptions> & IExpert & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IExpert>;
export default Expert;
//# sourceMappingURL=Expert.d.ts.map