import mongoose, { Document, Types } from "mongoose";
export interface IFaq extends Document {
    _id: Types.ObjectId;
    question: string;
    answer: string;
    category?: string;
    order: number;
    isActive: boolean;
    createdAt: Date;
}
declare const Faq: mongoose.Model<IFaq, {}, {}, {}, mongoose.Document<unknown, {}, IFaq, {}, mongoose.DefaultSchemaOptions> & IFaq & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IFaq>;
export default Faq;
//# sourceMappingURL=Faq.d.ts.map