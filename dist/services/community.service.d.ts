import mongoose from "mongoose";
import type { PaginationQuery } from "../types/index.js";
import type { ICommunityQuestion } from "../models/CommunityQuestion.js";
import type { ICommunityComment } from "../models/CommunityComment.js";
export declare function createQuestion(authorId: string, data: {
    title: string;
    body: string;
    category: string;
    tags?: string[];
    isAnonymous?: boolean;
}): Promise<ICommunityQuestion>;
export declare function listQuestions(query: PaginationQuery & {
    category?: string;
    search?: string;
}): Promise<import("../types/index.js").PaginatedResult<ICommunityQuestion>>;
export declare function getQuestionById(id: string): Promise<{
    question: mongoose.Document<unknown, {}, ICommunityQuestion, {}, mongoose.DefaultSchemaOptions> & ICommunityQuestion & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    };
    comments: (mongoose.Document<unknown, {}, ICommunityComment, {}, mongoose.DefaultSchemaOptions> & ICommunityComment & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    })[];
    replies: (mongoose.Document<unknown, {}, ICommunityComment, {}, mongoose.DefaultSchemaOptions> & ICommunityComment & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    })[];
}>;
export declare function updateQuestion(questionId: string, authorId: string, data: {
    title?: string;
    body?: string;
    tags?: string[];
}): Promise<ICommunityQuestion>;
export declare function deleteQuestion(questionId: string, authorId: string): Promise<void>;
export declare function toggleQuestionLike(questionId: string, userId: string): Promise<{
    liked: boolean;
    likesCount: number;
}>;
export declare function addComment(questionId: string, authorId: string, body: string, parentCommentId?: string): Promise<ICommunityComment>;
export declare function toggleCommentLike(commentId: string, userId: string): Promise<{
    liked: boolean;
    likesCount: number;
}>;
export declare function reportContent(reporterId: string, targetType: "question" | "comment" | "user" | "expert", targetId: string, reason: string, description?: string): Promise<mongoose.Document<unknown, {}, import("../models/Report.js").IReport, {}, mongoose.DefaultSchemaOptions> & import("../models/Report.js").IReport & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}>;
export declare function adminDeleteQuestion(questionId: string): Promise<void>;
export declare function adminDeleteComment(commentId: string): Promise<void>;
//# sourceMappingURL=community.service.d.ts.map