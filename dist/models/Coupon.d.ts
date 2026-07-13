import mongoose, { Document, Types } from "mongoose";
import { DiscountType } from "../types/index.js";
export interface ICoupon extends Document {
    _id: Types.ObjectId;
    code: string;
    discountType: DiscountType;
    discountValue: number;
    minAmount: number;
    maxDiscount?: number;
    usageLimit: number;
    usedCount: number;
    validFrom: Date;
    validTo: Date;
    isActive: boolean;
    createdAt: Date;
}
declare const Coupon: mongoose.Model<ICoupon, {}, {}, {}, mongoose.Document<unknown, {}, ICoupon, {}, mongoose.DefaultSchemaOptions> & ICoupon & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, ICoupon>;
export default Coupon;
//# sourceMappingURL=Coupon.d.ts.map