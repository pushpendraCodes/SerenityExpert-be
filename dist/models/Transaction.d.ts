import mongoose, { Document, Types } from "mongoose";
import { TransactionType, TransactionStatus } from "../types/index.js";
export interface ITransaction extends Document {
    _id: Types.ObjectId;
    userId: Types.ObjectId;
    type: TransactionType;
    amount: number;
    balanceBefore: number;
    balanceAfter: number;
    referenceId?: string;
    referenceType?: "call" | "chat" | "recharge" | "payout" | "adjustment";
    razorpayPaymentId?: string;
    razorpayOrderId?: string;
    description: string;
    status: TransactionStatus;
    createdAt: Date;
}
declare const Transaction: mongoose.Model<ITransaction, {}, {}, {}, mongoose.Document<unknown, {}, ITransaction, {}, mongoose.DefaultSchemaOptions> & ITransaction & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, ITransaction>;
export default Transaction;
//# sourceMappingURL=Transaction.d.ts.map