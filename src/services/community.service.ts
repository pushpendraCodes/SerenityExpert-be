import mongoose from "mongoose";
import CommunityQuestion from "../models/CommunityQuestion.js";
import CommunityComment from "../models/CommunityComment.js";
import Report from "../models/Report.js";
import Category from "../models/Category.js";
import User from "../models/User.js";
import Expert from "../models/Expert.js";
import { ensureContentSafe } from "./moderation.service.js";
import { paginate } from "../utils/pagination.js";
import { ReportStatus } from "../types/index.js";
import { NotFoundError, ForbiddenError } from "../utils/AppError.js";
import type { PaginationQuery } from "../types/index.js";
import type { ICommunityQuestion } from "../models/CommunityQuestion.js";
import type { ICommunityComment } from "../models/CommunityComment.js";
import { generateQuestionSlug, parseSlugIdSuffix } from "../utils/slug.js";

function deriveTitle(question: string): string {
  const trimmed = question.trim();
  if (trimmed.length <= 120) return trimmed;
  const cut = trimmed.slice(0, 120);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > 60 ? cut.slice(0, lastSpace) : cut).trim()}…`;
}

function withQuestionField<T extends { body?: string; title?: string }>(item: T) {
  const question = item.body || item.title || "";
  return { ...item, question };
}

async function ensureQuestionSlug(question: ICommunityQuestion): Promise<void> {
  if (question.slug) return;
  const slug = generateQuestionSlug(question.body || question.title, question._id.toString());
  question.slug = slug;
  try {
    await question.save();
  } catch {
    // Ignore duplicate slug races; lookup by suffix still works
  }
}

async function findQuestionRecord(idOrSlug: string) {
  if (mongoose.Types.ObjectId.isValid(idOrSlug) && String(idOrSlug).length === 24) {
    const byId = await CommunityQuestion.findOne({ _id: idOrSlug, isDeleted: false })
      .populate("category", "name slug");
    if (byId) return byId;
  }

  const bySlug = await CommunityQuestion.findOne({ slug: idOrSlug, isDeleted: false })
    .populate("category", "name slug");
  if (bySlug) return bySlug;

  const suffix = parseSlugIdSuffix(idOrSlug);
  if (suffix) {
    const bySuffix = await CommunityQuestion.findOne({
      isDeleted: false,
      $expr: {
        $eq: [{ $toLower: { $substr: [{ $toString: "$_id" }, 18, 6] } }, suffix],
      },
    }).populate("category", "name slug");
    if (bySuffix) return bySuffix;
  }

  return null;
}

export async function createQuestion(
  authorId: string,
  data: {
    question: string;
    category?: string;
    tags?: string[];
  }
): Promise<ICommunityQuestion> {
  const question = data.question.trim();
  await ensureContentSafe(question, "Question");

  const user = await User.findById(authorId);
  if (!user) throw new NotFoundError("User");

  let categoryId = data.category;
  if (categoryId) {
    const category = await Category.findById(categoryId);
    if (!category) throw new NotFoundError("Category");
  } else {
    const fallback = await Category.findOne({ isActive: true }).sort({ order: 1 });
    if (!fallback) throw new NotFoundError("Category");
    categoryId = fallback._id.toString();
  }

  // Users are always anonymous in community (no real name/photo shown)
  const questionDoc = await CommunityQuestion.create({
    authorId,
    authorName: "Anonymous",
    isAnonymous: true,
    title: deriveTitle(question),
    body: question,
    category: categoryId,
    tags: data.tags || [],
  });

  questionDoc.slug = generateQuestionSlug(question, questionDoc._id.toString());
  await questionDoc.save();
  return withQuestionField(questionDoc.toObject()) as unknown as ICommunityQuestion;
}

export async function listQuestions(query: PaginationQuery & { category?: string; search?: string }) {
  const filter: Record<string, unknown> = { isDeleted: false };

  if (query.category) filter.category = query.category;
  if (query.search) {
    const term = query.search.trim();
    if (term) {
      const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [
        { title: { $regex: escaped, $options: "i" } },
        { body: { $regex: escaped, $options: "i" } },
        { tags: { $regex: escaped, $options: "i" } },
      ];
    }
  }

  const result = await paginate({
    model: CommunityQuestion,
    filter,
    query,
    populate: { path: "category", select: "name slug" },
    sort: { createdAt: -1 },
  });

  result.data = result.data.map((item) => {
    const q = item as ICommunityQuestion & { authorId?: unknown };
    const plain = typeof (q as { toObject?: () => unknown }).toObject === "function"
      ? (q as { toObject: () => Record<string, unknown> }).toObject()
      : { ...(q as unknown as Record<string, unknown>) };
    plain.authorName = "Anonymous";
    plain.isAnonymous = true;
    delete plain.authorId;
    if (!plain.slug && plain._id) {
      const computed = generateQuestionSlug(String(plain.body || plain.title), String(plain._id));
      plain.slug = computed;
      CommunityQuestion.updateOne({ _id: plain._id, slug: { $in: [null, ""] } }, { slug: computed }).catch(() => {});
    }
    return withQuestionField(plain as { body?: string; title?: string }) as unknown as ICommunityQuestion;
  });

  return result;
}

export async function listMyQuestions(authorId: string, query: PaginationQuery) {
  const result = await paginate({
    model: CommunityQuestion,
    filter: { authorId, isDeleted: false },
    query,
    populate: { path: "category", select: "name slug" },
    sort: { createdAt: -1 },
  });

  result.data = result.data.map((item) => {
    const plain = typeof (item as { toObject?: () => unknown }).toObject === "function"
      ? (item as { toObject: () => Record<string, unknown> }).toObject()
      : { ...(item as unknown as Record<string, unknown>) };
    return withQuestionField(plain as { body?: string; title?: string }) as unknown as ICommunityQuestion;
  });

  return result;
}

export async function getQuestionById(idOrSlug: string) {
  const question = await findQuestionRecord(idOrSlug);
  if (!question) throw new NotFoundError("Question");

  await ensureQuestionSlug(question);

  const id = question._id.toString();

  // Never expose user identity on community questions
  const questionSafe = withQuestionField(question.toObject());
  questionSafe.authorName = "Anonymous";
  questionSafe.isAnonymous = true;
  delete (questionSafe as { authorId?: unknown }).authorId;

  const comments = await CommunityComment.find({ questionId: id, isDeleted: false, parentCommentId: null })
    .sort({ createdAt: 1 })
    .lean();

  const replies = await CommunityComment.find({
    questionId: id,
    isDeleted: false,
    parentCommentId: { $ne: null },
  })
    .sort({ createdAt: 1 })
    .lean();

  const stripAuthor = <T extends { authorId?: unknown }>(items: T[]) =>
    items.map(({ authorId: _authorId, ...rest }) => rest);

  return {
    question: questionSafe,
    comments: stripAuthor(comments),
    replies: stripAuthor(replies),
  };
}

export async function updateQuestion(
  questionId: string,
  authorId: string,
  data: { question?: string; tags?: string[] }
): Promise<ICommunityQuestion> {
  const question = await CommunityQuestion.findOne({ _id: questionId, authorId, isDeleted: false });
  if (!question) throw new NotFoundError("Question");

  if (data.question) {
    const text = data.question.trim();
    await ensureContentSafe(text, "Question");
    question.body = text;
    question.title = deriveTitle(text);
    question.slug = generateQuestionSlug(text, question._id.toString());
  }

  if (data.tags) question.tags = data.tags;
  await question.save();
  return withQuestionField(question.toObject()) as unknown as ICommunityQuestion;
}

export async function deleteQuestion(questionId: string, authorId: string): Promise<void> {
  const question = await CommunityQuestion.findOne({ _id: questionId, authorId });
  if (!question) throw new NotFoundError("Question");
  question.isDeleted = true;
  await question.save();
}

export async function toggleQuestionLike(questionId: string, userId: string): Promise<{ liked: boolean; likesCount: number }> {
  const question = await CommunityQuestion.findById(questionId);
  if (!question || question.isDeleted) throw new NotFoundError("Question");

  const userObjectId = new mongoose.Types.ObjectId(userId);
  const index = question.likes.findIndex((id) => id.toString() === userId);
  if (index >= 0) {
    question.likes.splice(index, 1);
  } else {
    question.likes.push(userObjectId);
  }
  question.likesCount = question.likes.length;
  await question.save();

  return { liked: index < 0, likesCount: question.likesCount };
}

export async function addComment(
  questionId: string,
  authorId: string,
  body: string,
  parentCommentId?: string
): Promise<ICommunityComment> {
  await ensureContentSafe(body, "Comment");

  const question = await CommunityQuestion.findOne({ _id: questionId, isDeleted: false });
  if (!question) throw new NotFoundError("Question");

  const user = await User.findById(authorId);
  const expert = await Expert.findOne({ userId: authorId });
  const authorRole = expert ? "expert" : "user";

  const comment = await CommunityComment.create({
    questionId,
    authorId,
    authorRole,
    body,
    parentCommentId: parentCommentId || undefined,
  });

  question.commentsCount += 1;
  await question.save();

  return comment;
}

export async function toggleCommentLike(commentId: string, userId: string): Promise<{ liked: boolean; likesCount: number }> {
  const comment = await CommunityComment.findById(commentId);
  if (!comment || comment.isDeleted) throw new NotFoundError("Comment");

  const userObjectId = new mongoose.Types.ObjectId(userId);
  const index = comment.likes.findIndex((id) => id.toString() === userId);
  if (index >= 0) {
    comment.likes.splice(index, 1);
  } else {
    comment.likes.push(userObjectId);
  }
  comment.likesCount = comment.likes.length;
  await comment.save();

  return { liked: index < 0, likesCount: comment.likesCount };
}

export async function reportContent(
  reporterId: string,
  targetType: "question" | "comment" | "user" | "expert",
  targetId: string,
  reason: string,
  description?: string
) {
  const report = await Report.create({
    reporterId,
    targetType,
    targetId,
    reason,
    description,
    status: ReportStatus.PENDING,
  });

  if (targetType === "question") {
    await CommunityQuestion.findByIdAndUpdate(targetId, { isFlagged: true });
  } else if (targetType === "comment") {
    await CommunityComment.findByIdAndUpdate(targetId, { isFlagged: true });
  }

  return report;
}

export async function adminDeleteQuestion(questionId: string): Promise<void> {
  await CommunityQuestion.findByIdAndUpdate(questionId, { isDeleted: true });
}

export async function adminDeleteComment(commentId: string): Promise<void> {
  const comment = await CommunityComment.findByIdAndUpdate(commentId, { isDeleted: true });
  if (comment) {
    await CommunityQuestion.findByIdAndUpdate(comment.questionId, { $inc: { commentsCount: -1 } });
  }
}
