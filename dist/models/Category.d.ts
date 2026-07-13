import mongoose, { Document, Types } from "mongoose";
export interface ICategory extends Document {
    _id: Types.ObjectId;
    name: string;
    slug: string;
    description?: string;
    icon?: string;
    isActive: boolean;
    order: number;
    createdAt: Date;
}
declare const Category: mongoose.Model<ICategory, {}, {}, {}, mongoose.Document<unknown, {}, ICategory, {}, mongoose.DefaultSchemaOptions> & ICategory & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, ICategory>;
export default Category;
//# sourceMappingURL=Category.d.ts.map