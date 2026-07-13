import mongoose, { Document, Types } from "mongoose";
export interface ICommunityQuestion extends Document {
    _id: Types.ObjectId;
    authorId: Types.ObjectId;
    authorName: string;
    isAnonymous: boolean;
    title: string;
    body: string;
    category: Types.ObjectId;
    tags: string[];
    likes: Types.ObjectId[];
    likesCount: number;
    commentsCount: number;
    isModerated: boolean;
    isFlagged: boolean;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}
declare const CommunityQuestion: mongoose.Model<ICommunityQuestion, {}, {}, {}, mongoose.Document<unknown, {}, ICommunityQuestion, {}, mongoose.DefaultSchemaOptions> & ICommunityQuestion & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, ICommunityQuestion>;
export default CommunityQuestion;
//# sourceMappingURL=CommunityQuestion.d.ts.map