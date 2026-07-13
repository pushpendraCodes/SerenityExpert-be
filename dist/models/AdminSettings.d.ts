import mongoose, { Document, Types } from "mongoose";
export interface IAdminSettings extends Document {
    _id: Types.ObjectId;
    key: string;
    value: string;
    description?: string;
    updatedBy?: Types.ObjectId;
    updatedAt: Date;
}
declare const AdminSettings: mongoose.Model<IAdminSettings, {}, {}, {}, mongoose.Document<unknown, {}, IAdminSettings, {}, mongoose.DefaultSchemaOptions> & IAdminSettings & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IAdminSettings>;
export default AdminSettings;
//# sourceMappingURL=AdminSettings.d.ts.map