"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listQuestionsSchema = exports.reportContentSchema = exports.replyCommentSchema = exports.createCommentSchema = exports.updateQuestionSchema = exports.createQuestionSchema = void 0;
const zod_1 = require("zod");
exports.createQuestionSchema = zod_1.z.object({
    question: zod_1.z.string().min(10).max(5000),
    category: zod_1.z.string().min(1).optional(),
    tags: zod_1.z.array(zod_1.z.string()).max(10).optional(),
});
exports.updateQuestionSchema = zod_1.z.object({
    question: zod_1.z.string().min(10).max(5000).optional(),
    tags: zod_1.z.array(zod_1.z.string()).max(10).optional(),
});
exports.createCommentSchema = zod_1.z.object({
    body: zod_1.z.string().min(1).max(2000),
});
exports.replyCommentSchema = zod_1.z.object({
    body: zod_1.z.string().min(1).max(2000),
});
exports.reportContentSchema = zod_1.z.object({
    targetType: zod_1.z.enum(["question", "comment", "user", "expert"]),
    targetId: zod_1.z.string().min(1),
    reason: zod_1.z.string().min(3).max(200),
    description: zod_1.z.string().max(1000).optional(),
});
exports.listQuestionsSchema = zod_1.z.object({
    category: zod_1.z.string().optional(),
    search: zod_1.z.string().optional(),
    page: zod_1.z.coerce.number().int().min(1).optional(),
    limit: zod_1.z.coerce.number().int().min(1).max(100).optional(),
});
//# sourceMappingURL=community.validator.js.map