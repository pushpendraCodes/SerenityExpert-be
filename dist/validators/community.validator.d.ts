import { z } from "zod";
export declare const createQuestionSchema: z.ZodObject<{
    title: z.ZodString;
    body: z.ZodString;
    category: z.ZodString;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    isAnonymous: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    body: string;
    title: string;
    category: string;
    isAnonymous?: boolean | undefined;
    tags?: string[] | undefined;
}, {
    body: string;
    title: string;
    category: string;
    isAnonymous?: boolean | undefined;
    tags?: string[] | undefined;
}>;
export declare const updateQuestionSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    body: z.ZodOptional<z.ZodString>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    body?: string | undefined;
    title?: string | undefined;
    tags?: string[] | undefined;
}, {
    body?: string | undefined;
    title?: string | undefined;
    tags?: string[] | undefined;
}>;
export declare const createCommentSchema: z.ZodObject<{
    body: z.ZodString;
}, "strip", z.ZodTypeAny, {
    body: string;
}, {
    body: string;
}>;
export declare const replyCommentSchema: z.ZodObject<{
    body: z.ZodString;
    parentCommentId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    body: string;
    parentCommentId: string;
}, {
    body: string;
    parentCommentId: string;
}>;
export declare const reportContentSchema: z.ZodObject<{
    targetType: z.ZodEnum<["question", "comment", "user", "expert"]>;
    targetId: z.ZodString;
    reason: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    targetType: "user" | "expert" | "comment" | "question";
    targetId: string;
    reason: string;
    description?: string | undefined;
}, {
    targetType: "user" | "expert" | "comment" | "question";
    targetId: string;
    reason: string;
    description?: string | undefined;
}>;
export declare const listQuestionsSchema: z.ZodObject<{
    category: z.ZodOptional<z.ZodString>;
    search: z.ZodOptional<z.ZodString>;
    page: z.ZodOptional<z.ZodNumber>;
    limit: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    search?: string | undefined;
    limit?: number | undefined;
    page?: number | undefined;
    category?: string | undefined;
}, {
    search?: string | undefined;
    limit?: number | undefined;
    page?: number | undefined;
    category?: string | undefined;
}>;
//# sourceMappingURL=community.validator.d.ts.map