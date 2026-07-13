import mongoose, { Document, Types } from "mongoose";
export interface IBanner extends Document {
    _id: Types.ObjectId;
    title: string;
    imageUrl: string;
    link?: string;
    position: "home" | "expert_list" | "community";
    isActive: boolean;
    startDate?: Date;
    endDate?: Date;
    order: number;
    createdAt: Date;
}
declare const Banner: mongoose.Model<IBanner, {}, {}, {}, mongoose.Document<unknown, {}, IBanner, {}, mongoose.DefaultSchemaOptions> & IBanner & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IBanner>;
export default Banner;
//# sourceMappingURL=Banner.d.ts.map