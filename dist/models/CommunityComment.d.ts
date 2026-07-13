import mongoose, { Document, Types } from "mongoose";
export interface ICommunityComment extends Document {
    _id: Types.ObjectId;
    questionId: Types.ObjectId;
    authorId: Types.ObjectId;
    authorRole: "user" | "expert";
    body: string;
    parentCommentId?: Types.ObjectId;
    likes: Types.ObjectId[];
    likesCount: number;
    isModerated: boolean;
    isFlagged: boolean;
    isDeleted: boolean;
    createdAt: Date;
}
declare const CommunityComment: mongoose.Model<ICommunityComment, {}, {}, {}, mongoose.Document<unknown, {}, ICommunityComment, {}, mongoose.DefaultSchemaOptions> & ICommunityComment & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, ICommunityComment>;
export default CommunityComment;
//# sourceMappingURL=CommunityComment.d.ts.map