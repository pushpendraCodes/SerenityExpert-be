import mongoose, { Document, Types } from "mongoose";
import { RechargeStatus } from "../types/index.js";
export interface IRecharge extends Document {
    _id: Types.ObjectId;
    userId: Types.ObjectId;
    amount: number;
    razorpayOrderId: string;
    razorpayPaymentId?: string;
    razorpaySignature?: string;
    status: RechargeStatus;
    couponCode?: string;
    discountAmount?: number;
    createdAt: Date;
}
declare const Recharge: mongoose.Model<IRecharge, {}, {}, {}, mongoose.Document<unknown, {}, IRecharge, {}, mongoose.DefaultSchemaOptions> & IRecharge & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IRecharge>;
export default Recharge;
//# sourceMappingURL=Recharge.d.ts.map