import mongoose, { Document, Types } from "mongoose";
import { PayoutStatus } from "../types/index.js";
export interface IPayout extends Document {
    _id: Types.ObjectId;
    expertId: Types.ObjectId;
    amount: number;
    commission: number;
    netAmount: number;
    periodStart: Date;
    periodEnd: Date;
    status: PayoutStatus;
    razorpayPayoutId?: string;
    transactionRef?: string;
    processedAt?: Date;
    notes?: string;
    createdAt: Date;
}
declare const Payout: mongoose.Model<IPayout, {}, {}, {}, mongoose.Document<unknown, {}, IPayout, {}, mongoose.DefaultSchemaOptions> & IPayout & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IPayout>;
export default Payout;
//# sourceMappingURL=Payout.d.ts.map