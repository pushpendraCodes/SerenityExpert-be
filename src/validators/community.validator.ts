import { z } from "zod";

export const createQuestionSchema = z.object({
  question: z.string().min(10).max(5000),
  category: z.string().min(1).optional(),
  tags: z.array(z.string()).max(10).optional(),
});

export const updateQuestionSchema = z.object({
  question: z.string().min(10).max(5000).optional(),
  tags: z.array(z.string()).max(10).optional(),
});

export const createCommentSchema = z.object({
  body: z.string().min(1).max(2000),
});

export const replyCommentSchema = z.object({
  body: z.string().min(1).max(2000),
});

export const reportContentSchema = z.object({
  targetType: z.enum(["question", "comment", "user", "expert"]),
  targetId: z.string().min(1),
  reason: z.string().min(3).max(200),
  description: z.string().max(1000).optional(),
});

export const listQuestionsSchema = z.object({
  category: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});
