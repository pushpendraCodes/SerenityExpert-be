"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createQuestion = createQuestion;
exports.listQuestions = listQuestions;
exports.listMyQuestions = listMyQuestions;
exports.getQuestionById = getQuestionById;
exports.updateQuestion = updateQuestion;
exports.deleteQuestion = deleteQuestion;
exports.toggleQuestionLike = toggleQuestionLike;
exports.addComment = addComment;
exports.toggleCommentLike = toggleCommentLike;
exports.reportContent = reportContent;
exports.adminDeleteQuestion = adminDeleteQuestion;
exports.adminDeleteComment = adminDeleteComment;
const mongoose_1 = __importDefault(require("mongoose"));
const CommunityQuestion_js_1 = __importDefault(require("../models/CommunityQuestion.js"));
const CommunityComment_js_1 = __importDefault(require("../models/CommunityComment.js"));
const Report_js_1 = __importDefault(require("../models/Report.js"));
const Category_js_1 = __importDefault(require("../models/Category.js"));
const User_js_1 = __importDefault(require("../models/User.js"));
const Expert_js_1 = __importDefault(require("../models/Expert.js"));
const moderation_service_js_1 = require("./moderation.service.js");
const pagination_js_1 = require("../utils/pagination.js");
const index_js_1 = require("../types/index.js");
const AppError_js_1 = require("../utils/AppError.js");
const slug_js_1 = require("../utils/slug.js");
function deriveTitle(question) {
    const trimmed = question.trim();
    if (trimmed.length <= 120)
        return trimmed;
    const cut = trimmed.slice(0, 120);
    const lastSpace = cut.lastIndexOf(" ");
    return `${(lastSpace > 60 ? cut.slice(0, lastSpace) : cut).trim()}…`;
}
function withQuestionField(item) {
    const question = item.body || item.title || "";
    return { ...item, question };
}
async function ensureQuestionSlug(question) {
    if (question.slug)
        return;
    const slug = (0, slug_js_1.generateQuestionSlug)(question.body || question.title, question._id.toString());
    question.slug = slug;
    try {
        await question.save();
    }
    catch {
        // Ignore duplicate slug races; lookup by suffix still works
    }
}
async function findQuestionRecord(idOrSlug) {
    if (mongoose_1.default.Types.ObjectId.isValid(idOrSlug) && String(idOrSlug).length === 24) {
        const byId = await CommunityQuestion_js_1.default.findOne({ _id: idOrSlug, isDeleted: false })
            .populate("category", "name slug");
        if (byId)
            return byId;
    }
    const bySlug = await CommunityQuestion_js_1.default.findOne({ slug: idOrSlug, isDeleted: false })
        .populate("category", "name slug");
    if (bySlug)
        return bySlug;
    const suffix = (0, slug_js_1.parseSlugIdSuffix)(idOrSlug);
    if (suffix) {
        const bySuffix = await CommunityQuestion_js_1.default.findOne({
            isDeleted: false,
            $expr: {
                $eq: [{ $toLower: { $substr: [{ $toString: "$_id" }, 18, 6] } }, suffix],
            },
        }).populate("category", "name slug");
        if (bySuffix)
            return bySuffix;
    }
    return null;
}
async function createQuestion(authorId, data) {
    const question = data.question.trim();
    await (0, moderation_service_js_1.ensureContentSafe)(question, "Question");
    const user = await User_js_1.default.findById(authorId);
    if (!user)
        throw new AppError_js_1.NotFoundError("User");
    let categoryId = data.category;
    if (categoryId) {
        const category = await Category_js_1.default.findById(categoryId);
        if (!category)
            throw new AppError_js_1.NotFoundError("Category");
    }
    else {
        const fallback = await Category_js_1.default.findOne({ isActive: true }).sort({ order: 1 });
        if (!fallback)
            throw new AppError_js_1.NotFoundError("Category");
        categoryId = fallback._id.toString();
    }
    // Users are always anonymous in community (no real name/photo shown)
    const questionDoc = await CommunityQuestion_js_1.default.create({
        authorId,
        authorName: "Anonymous",
        isAnonymous: true,
        title: deriveTitle(question),
        body: question,
        category: categoryId,
        tags: data.tags || [],
    });
    questionDoc.slug = (0, slug_js_1.generateQuestionSlug)(question, questionDoc._id.toString());
    await questionDoc.save();
    return withQuestionField(questionDoc.toObject());
}
async function listQuestions(query) {
    const filter = { isDeleted: false };
    if (query.category)
        filter.category = query.category;
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
    const result = await (0, pagination_js_1.paginate)({
        model: CommunityQuestion_js_1.default,
        filter,
        query,
        populate: { path: "category", select: "name slug" },
        sort: { createdAt: -1 },
    });
    result.data = result.data.map((item) => {
        const q = item;
        const plain = typeof q.toObject === "function"
            ? q.toObject()
            : { ...q };
        plain.authorName = "Anonymous";
        plain.isAnonymous = true;
        delete plain.authorId;
        if (!plain.slug && plain._id) {
            const computed = (0, slug_js_1.generateQuestionSlug)(String(plain.body || plain.title), String(plain._id));
            plain.slug = computed;
            CommunityQuestion_js_1.default.updateOne({ _id: plain._id, slug: { $in: [null, ""] } }, { slug: computed }).catch(() => { });
        }
        return withQuestionField(plain);
    });
    return result;
}
async function listMyQuestions(authorId, query) {
    const result = await (0, pagination_js_1.paginate)({
        model: CommunityQuestion_js_1.default,
        filter: { authorId, isDeleted: false },
        query,
        populate: { path: "category", select: "name slug" },
        sort: { createdAt: -1 },
    });
    result.data = result.data.map((item) => {
        const plain = typeof item.toObject === "function"
            ? item.toObject()
            : { ...item };
        return withQuestionField(plain);
    });
    return result;
}
async function getQuestionById(idOrSlug) {
    const question = await findQuestionRecord(idOrSlug);
    if (!question)
        throw new AppError_js_1.NotFoundError("Question");
    await ensureQuestionSlug(question);
    const id = question._id.toString();
    // Never expose user identity on community questions
    const questionSafe = withQuestionField(question.toObject());
    questionSafe.authorName = "Anonymous";
    questionSafe.isAnonymous = true;
    delete questionSafe.authorId;
    const comments = await CommunityComment_js_1.default.find({ questionId: id, isDeleted: false, parentCommentId: null })
        .sort({ createdAt: 1 })
        .lean();
    const replies = await CommunityComment_js_1.default.find({
        questionId: id,
        isDeleted: false,
        parentCommentId: { $ne: null },
    })
        .sort({ createdAt: 1 })
        .lean();
    const stripAuthor = (items) => items.map(({ authorId: _authorId, ...rest }) => rest);
    return {
        question: questionSafe,
        comments: stripAuthor(comments),
        replies: stripAuthor(replies),
    };
}
async function updateQuestion(questionId, authorId, data) {
    const question = await CommunityQuestion_js_1.default.findOne({ _id: questionId, authorId, isDeleted: false });
    if (!question)
        throw new AppError_js_1.NotFoundError("Question");
    if (data.question) {
        const text = data.question.trim();
        await (0, moderation_service_js_1.ensureContentSafe)(text, "Question");
        question.body = text;
        question.title = deriveTitle(text);
        question.slug = (0, slug_js_1.generateQuestionSlug)(text, question._id.toString());
    }
    if (data.tags)
        question.tags = data.tags;
    await question.save();
    return withQuestionField(question.toObject());
}
async function deleteQuestion(questionId, authorId) {
    const question = await CommunityQuestion_js_1.default.findOne({ _id: questionId, authorId });
    if (!question)
        throw new AppError_js_1.NotFoundError("Question");
    question.isDeleted = true;
    await question.save();
}
async function toggleQuestionLike(questionId, userId) {
    const question = await CommunityQuestion_js_1.default.findById(questionId);
    if (!question || question.isDeleted)
        throw new AppError_js_1.NotFoundError("Question");
    const userObjectId = new mongoose_1.default.Types.ObjectId(userId);
    const index = question.likes.findIndex((id) => id.toString() === userId);
    if (index >= 0) {
        question.likes.splice(index, 1);
    }
    else {
        question.likes.push(userObjectId);
    }
    question.likesCount = question.likes.length;
    await question.save();
    return { liked: index < 0, likesCount: question.likesCount };
}
async function addComment(questionId, authorId, body, parentCommentId) {
    await (0, moderation_service_js_1.ensureContentSafe)(body, "Comment");
    const question = await CommunityQuestion_js_1.default.findOne({ _id: questionId, isDeleted: false });
    if (!question)
        throw new AppError_js_1.NotFoundError("Question");
    const user = await User_js_1.default.findById(authorId);
    const expert = await Expert_js_1.default.findOne({ userId: authorId });
    const authorRole = expert ? "expert" : "user";
    const comment = await CommunityComment_js_1.default.create({
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
async function toggleCommentLike(commentId, userId) {
    const comment = await CommunityComment_js_1.default.findById(commentId);
    if (!comment || comment.isDeleted)
        throw new AppError_js_1.NotFoundError("Comment");
    const userObjectId = new mongoose_1.default.Types.ObjectId(userId);
    const index = comment.likes.findIndex((id) => id.toString() === userId);
    if (index >= 0) {
        comment.likes.splice(index, 1);
    }
    else {
        comment.likes.push(userObjectId);
    }
    comment.likesCount = comment.likes.length;
    await comment.save();
    return { liked: index < 0, likesCount: comment.likesCount };
}
async function reportContent(reporterId, targetType, targetId, reason, description) {
    const report = await Report_js_1.default.create({
        reporterId,
        targetType,
        targetId,
        reason,
        description,
        status: index_js_1.ReportStatus.PENDING,
    });
    if (targetType === "question") {
        await CommunityQuestion_js_1.default.findByIdAndUpdate(targetId, { isFlagged: true });
    }
    else if (targetType === "comment") {
        await CommunityComment_js_1.default.findByIdAndUpdate(targetId, { isFlagged: true });
    }
    return report;
}
async function adminDeleteQuestion(questionId) {
    await CommunityQuestion_js_1.default.findByIdAndUpdate(questionId, { isDeleted: true });
}
async function adminDeleteComment(commentId) {
    const comment = await CommunityComment_js_1.default.findByIdAndUpdate(commentId, { isDeleted: true });
    if (comment) {
        await CommunityQuestion_js_1.default.findByIdAndUpdate(comment.questionId, { $inc: { commentsCount: -1 } });
    }
}
//# sourceMappingURL=community.service.js.map