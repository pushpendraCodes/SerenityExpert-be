import mongoose, { Document, Types } from "mongoose";
import { ReportStatus } from "../types/index.js";
export interface IReport extends Document {
    _id: Types.ObjectId;
    reporterId: Types.ObjectId;
    targetType: "question" | "comment" | "user" | "expert";
    targetId: Types.ObjectId;
    reason: string;
    description?: string;
    status: ReportStatus;
    reviewedBy?: Types.ObjectId;
    reviewedAt?: Date;
    action?: string;
    createdAt: Date;
}
declare const Report: mongoose.Model<IReport, {}, {}, {}, mongoose.Document<unknown, {}, IReport, {}, mongoose.DefaultSchemaOptions> & IReport & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IReport>;
export default Report;
//# sourceMappingURL=Report.d.ts.map