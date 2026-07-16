"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cmsService = void 0;
exports.getDashboardMetrics = getDashboardMetrics;
exports.getAnalytics = getAnalytics;
exports.listUsers = listUsers;
exports.updateUser = updateUser;
exports.listExperts = listExperts;
exports.updateExpertByAdmin = updateExpertByAdmin;
exports.approveExpert = approveExpert;
exports.getTransactions = getTransactions;
exports.listCalls = listCalls;
exports.getCommissionReport = getCommissionReport;
exports.issueRefund = issueRefund;
exports.moderateQuestion = moderateQuestion;
exports.runAiModerationOnQuestion = runAiModerationOnQuestion;
exports.getReports = getReports;
exports.resolveReport = resolveReport;
exports.getSettings = getSettings;
exports.updateSettings = updateSettings;
exports.getSettingValue = getSettingValue;
exports.getDefaultPricePerMinute = getDefaultPricePerMinute;
exports.getDefaultCommission = getDefaultCommission;
exports.getPriceLimits = getPriceLimits;
exports.assertPriceWithinLimits = assertPriceWithinLimits;
exports.seedDefaultSettings = seedDefaultSettings;
exports.getRetentionDays = getRetentionDays;
const User_js_1 = __importDefault(require("../models/User.js"));
const Expert_js_1 = __importDefault(require("../models/Expert.js"));
const Call_js_1 = __importDefault(require("../models/Call.js"));
const Transaction_js_1 = __importDefault(require("../models/Transaction.js"));
const Recharge_js_1 = __importDefault(require("../models/Recharge.js"));
const Payout_js_1 = __importDefault(require("../models/Payout.js"));
const Report_js_1 = __importDefault(require("../models/Report.js"));
const Category_js_1 = __importDefault(require("../models/Category.js"));
const Faq_js_1 = __importDefault(require("../models/Faq.js"));
const Banner_js_1 = __importDefault(require("../models/Banner.js"));
const Coupon_js_1 = __importDefault(require("../models/Coupon.js"));
const AdminSettings_js_1 = __importDefault(require("../models/AdminSettings.js"));
const CommunityQuestion_js_1 = __importDefault(require("../models/CommunityQuestion.js"));
const wallet_service_js_1 = require("./wallet.service.js");
const moderation_service_js_1 = require("./moderation.service.js");
const index_js_1 = require("../types/index.js");
const constants_js_1 = require("../utils/constants.js");
const pagination_js_1 = require("../utils/pagination.js");
const AppError_js_1 = require("../utils/AppError.js");
async function getDashboardMetrics() {
    const [totalUsers, totalExperts, onlineExperts, activeCalls, totalRevenue, pendingReports, pendingExpertApprovals,] = await Promise.all([
        User_js_1.default.countDocuments({ role: index_js_1.UserRole.USER }),
        Expert_js_1.default.countDocuments({ isApproved: true }),
        Expert_js_1.default.countDocuments({ status: index_js_1.ExpertStatus.ONLINE, isApproved: true }),
        Call_js_1.default.countDocuments({ status: index_js_1.CallStatus.ACTIVE }),
        Transaction_js_1.default.aggregate([
            { $match: { type: "recharge", status: "completed" } },
            { $group: { _id: null, total: { $sum: "$amount" } } },
        ]),
        Report_js_1.default.countDocuments({ status: index_js_1.ReportStatus.PENDING }),
        Expert_js_1.default.countDocuments({ isApproved: false }),
    ]);
    return {
        totalUsers,
        totalExperts,
        onlineExperts,
        activeCalls,
        totalRevenue: totalRevenue[0]?.total || 0,
        pendingReports,
        pendingExpertApprovals,
    };
}
async function getAnalytics(period = "week") {
    const days = period === "week" ? 7 : period === "month" ? 30 : 365;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const [userSignups, recharges, calls, revenue] = await Promise.all([
        User_js_1.default.aggregate([
            { $match: { createdAt: { $gte: startDate } } },
            { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
            { $sort: { _id: 1 } },
        ]),
        Recharge_js_1.default.aggregate([
            { $match: { status: index_js_1.RechargeStatus.PAID, createdAt: { $gte: startDate } } },
            { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 }, amount: { $sum: "$amount" } } },
            { $sort: { _id: 1 } },
        ]),
        Call_js_1.default.aggregate([
            { $match: { status: index_js_1.CallStatus.COMPLETED, createdAt: { $gte: startDate } } },
            { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 }, revenue: { $sum: "$totalCost" } } },
            { $sort: { _id: 1 } },
        ]),
        Transaction_js_1.default.aggregate([
            { $match: { type: "recharge", status: "completed", createdAt: { $gte: startDate } } },
            { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, total: { $sum: "$amount" } } },
            { $sort: { _id: 1 } },
        ]),
    ]);
    return { userSignups, recharges, calls, revenue, period };
}
async function listUsers(query) {
    const filter = {};
    if (query.role)
        filter.role = query.role;
    if (query.search) {
        filter.$or = [
            { name: { $regex: query.search, $options: "i" } },
            { phone: { $regex: query.search, $options: "i" } },
            { email: { $regex: query.search, $options: "i" } },
        ];
    }
    return (0, pagination_js_1.paginate)({ model: User_js_1.default, filter, query, sort: { createdAt: -1 } });
}
async function updateUser(userId, data) {
    const user = await User_js_1.default.findByIdAndUpdate(userId, data, { new: true });
    if (!user)
        throw new AppError_js_1.NotFoundError("User");
    return user;
}
async function listExperts(query) {
    const filter = {};
    if (query.approved === "pending")
        filter.isApproved = false;
    else if (query.approved === "approved")
        filter.isApproved = true;
    if (query.search) {
        const escaped = query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const regex = { $regex: escaped, $options: "i" };
        // Name/email/phone live on the linked User doc — resolve matching users first.
        const users = await User_js_1.default.find({
            $or: [{ name: regex }, { phone: regex }, { email: regex }],
        }).select("_id");
        filter.$or = [{ mobile: regex }, { userId: { $in: users.map((u) => u._id) } }];
    }
    return (0, pagination_js_1.paginate)({
        model: Expert_js_1.default,
        filter,
        query,
        populate: { path: "userId", select: "name phone email avatar isBlocked" },
        sort: { createdAt: -1 },
    });
}
async function updateExpertByAdmin(expertId, data) {
    const expert = await Expert_js_1.default.findById(expertId);
    if (!expert)
        throw new AppError_js_1.NotFoundError("Expert");
    if (data.pricePerMinute !== undefined) {
        await assertPriceWithinLimits(data.pricePerMinute);
    }
    if (data.bio !== undefined)
        expert.bio = data.bio;
    if (data.experience !== undefined)
        expert.experience = data.experience;
    if (data.categories !== undefined)
        expert.categories = data.categories;
    if (data.languages !== undefined)
        expert.languages = data.languages;
    if (data.pricePerMinute !== undefined)
        expert.pricePerMinute = data.pricePerMinute;
    if (data.commissionPercent !== undefined)
        expert.commissionPercent = data.commissionPercent;
    await expert.save();
    if (data.name !== undefined) {
        await User_js_1.default.findByIdAndUpdate(expert.userId, { name: data.name });
    }
    return Expert_js_1.default.findById(expertId).populate("userId", "name phone email avatar isBlocked");
}
async function approveExpert(expertId, data) {
    const expert = await Expert_js_1.default.findById(expertId);
    if (!expert)
        throw new AppError_js_1.NotFoundError("Expert");
    if (data.pricePerMinute !== undefined) {
        await assertPriceWithinLimits(data.pricePerMinute);
    }
    expert.isApproved = data.isApproved;
    if (data.rejectionReason)
        expert.rejectionReason = data.rejectionReason;
    if (data.pricePerMinute !== undefined)
        expert.pricePerMinute = data.pricePerMinute;
    if (data.commissionPercent !== undefined)
        expert.commissionPercent = data.commissionPercent;
    if (data.isApproved) {
        expert.isVerified = true;
        await User_js_1.default.findByIdAndUpdate(expert.userId, { role: index_js_1.UserRole.EXPERT });
    }
    else {
        expert.isVerified = false;
        await User_js_1.default.findByIdAndUpdate(expert.userId, { role: index_js_1.UserRole.USER });
    }
    await expert.save();
    return expert;
}
async function getTransactions(query) {
    const filter = {};
    if (query.type)
        filter.type = query.type;
    if (query.userId)
        filter.userId = query.userId;
    return (0, pagination_js_1.paginate)({
        model: Transaction_js_1.default,
        filter,
        query,
        populate: { path: "userId", select: "name phone email" },
        sort: { createdAt: -1 },
    });
}
async function listCalls(query) {
    const filter = {};
    if (query.status)
        filter.status = query.status;
    if (query.hasRecording === "true")
        filter.recordingUrl = { $exists: true, $nin: [null, ""] };
    return (0, pagination_js_1.paginate)({
        model: Call_js_1.default,
        filter,
        query,
        populate: [
            { path: "userId", select: "name phone avatar" },
            { path: "expertId", populate: { path: "userId", select: "name avatar" } },
        ],
        sort: { createdAt: -1 },
    });
}
/** Aggregate revenue, platform commission, payouts, and refunds over a period. */
async function getCommissionReport(period = "month") {
    const days = period === "week" ? 7 : period === "month" ? 30 : 365;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const [callAgg, payoutAgg, refundAgg] = await Promise.all([
        Call_js_1.default.aggregate([
            { $match: { status: index_js_1.CallStatus.COMPLETED, endedAt: { $gte: startDate } } },
            { $lookup: { from: "experts", localField: "expertId", foreignField: "_id", as: "expert" } },
            { $unwind: { path: "$expert", preserveNullAndEmptyArrays: true } },
            {
                $group: {
                    _id: null,
                    grossRevenue: { $sum: "$totalCost" },
                    totalCalls: { $sum: 1 },
                    platformCommission: {
                        $sum: {
                            $divide: [
                                {
                                    $multiply: [
                                        "$totalCost",
                                        { $ifNull: ["$expert.commissionPercent", constants_js_1.DEFAULT_COMMISSION_PERCENT] },
                                    ],
                                },
                                100,
                            ],
                        },
                    },
                },
            },
        ]),
        Payout_js_1.default.aggregate([
            { $match: { status: "completed", processedAt: { $gte: startDate } } },
            { $group: { _id: null, total: { $sum: "$netAmount" }, count: { $sum: 1 } } },
        ]),
        Transaction_js_1.default.aggregate([
            { $match: { type: "refund", status: "completed", createdAt: { $gte: startDate } } },
            { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
        ]),
    ]);
    const round = (n) => Math.round(n * 100) / 100;
    const grossRevenue = round(callAgg[0]?.grossRevenue || 0);
    const platformCommission = round(callAgg[0]?.platformCommission || 0);
    return {
        period,
        totalCalls: callAgg[0]?.totalCalls || 0,
        grossRevenue,
        platformCommission,
        expertEarnings: round(grossRevenue - platformCommission),
        payoutsPaid: round(payoutAgg[0]?.total || 0),
        payoutCount: payoutAgg[0]?.count || 0,
        refundsTotal: round(refundAgg[0]?.total || 0),
        refundCount: refundAgg[0]?.count || 0,
    };
}
/** Admin-issued refund — credits the user's wallet with a REFUND transaction. */
async function issueRefund(data, adminId) {
    const user = await User_js_1.default.findById(data.userId);
    if (!user)
        throw new AppError_js_1.NotFoundError("User");
    const result = await (0, wallet_service_js_1.creditWallet)(data.userId, data.amount, data.description, {
        type: index_js_1.TransactionType.REFUND,
        referenceType: data.callId ? "call" : "adjustment",
        referenceId: data.callId || adminId,
    });
    return { balanceAfter: result.balanceAfter };
}
/** Flag/unflag/hide a community question from the moderation queue. */
async function moderateQuestion(questionId, data) {
    const update = {};
    if (data.isFlagged !== undefined)
        update.isFlagged = data.isFlagged;
    if (data.isModerated !== undefined)
        update.isModerated = data.isModerated;
    if (data.isDeleted !== undefined)
        update.isDeleted = data.isDeleted;
    const question = await CommunityQuestion_js_1.default.findByIdAndUpdate(questionId, update, { new: true });
    if (!question)
        throw new AppError_js_1.NotFoundError("Question");
    return question;
}
/** Run AI moderation on a single question on demand and persist the verdict. */
async function runAiModerationOnQuestion(questionId) {
    const question = await CommunityQuestion_js_1.default.findById(questionId);
    if (!question)
        throw new AppError_js_1.NotFoundError("Question");
    const moderation = await (0, moderation_service_js_1.moderateContent)(question.body || question.title);
    question.isModerated = true;
    question.isFlagged = moderation.isFlagged && moderation.confidence > 0.5;
    await question.save();
    return { question, moderation };
}
async function getReports(query) {
    const filter = {};
    if (query.status)
        filter.status = query.status;
    return (0, pagination_js_1.paginate)({
        model: Report_js_1.default,
        filter,
        query,
        populate: { path: "reporterId", select: "name" },
        sort: { createdAt: -1 },
    });
}
async function resolveReport(reportId, adminId, data) {
    const report = await Report_js_1.default.findByIdAndUpdate(reportId, { ...data, reviewedBy: adminId, reviewedAt: new Date() }, { new: true });
    if (!report)
        throw new AppError_js_1.NotFoundError("Report");
    return report;
}
async function getSettings() {
    const settings = await AdminSettings_js_1.default.find();
    const map = {};
    settings.forEach((s) => { map[s.key] = s.value; });
    return map;
}
async function updateSettings(settings, adminId) {
    for (const setting of settings) {
        await AdminSettings_js_1.default.findOneAndUpdate({ key: setting.key }, { value: setting.value, description: setting.description, updatedBy: adminId }, { upsert: true });
    }
}
async function getSettingValue(key, defaultValue) {
    const setting = await AdminSettings_js_1.default.findOne({ key });
    return setting?.value ?? defaultValue;
}
async function getDefaultPricePerMinute() {
    const val = await getSettingValue("default_price_per_minute", "10");
    return Number(val);
}
async function getDefaultCommission() {
    const val = await getSettingValue("default_commission_percent", String(constants_js_1.DEFAULT_COMMISSION_PERCENT));
    return Number(val);
}
async function getPriceLimits() {
    const [minRaw, maxRaw] = await Promise.all([
        getSettingValue("min_price_per_minute", "5"),
        getSettingValue("max_price_per_minute", "100"),
    ]);
    const min = Number(minRaw);
    const max = Number(maxRaw);
    return {
        min: Number.isFinite(min) ? min : 5,
        max: Number.isFinite(max) ? max : 100,
    };
}
/** Enforce Settings → min/max price per minute guardrails. */
async function assertPriceWithinLimits(pricePerMinute) {
    const { min, max } = await getPriceLimits();
    if (pricePerMinute < min || pricePerMinute > max) {
        throw new AppError_js_1.ValidationError("Validation failed", {
            pricePerMinute: [`Price must be between ₹${min} and ₹${max} per minute`],
        });
    }
}
// CMS helpers
exports.cmsService = {
    listCategories: () => Category_js_1.default.find({ isActive: true }).sort({ order: 1 }),
    createCategory: (data) => Category_js_1.default.create(data),
    updateCategory: (id, data) => Category_js_1.default.findByIdAndUpdate(id, data, { new: true }),
    deleteCategory: (id) => Category_js_1.default.findByIdAndUpdate(id, { isActive: false }),
    listFaqs: () => Faq_js_1.default.find({ isActive: true }).sort({ order: 1 }),
    createFaq: (data) => Faq_js_1.default.create(data),
    updateFaq: (id, data) => Faq_js_1.default.findByIdAndUpdate(id, data, { new: true }),
    deleteFaq: (id) => Faq_js_1.default.findByIdAndUpdate(id, { isActive: false }),
    listBanners: () => Banner_js_1.default.find({ isActive: true, startDate: { $lte: new Date() }, endDate: { $gte: new Date() } }),
    createBanner: (data) => Banner_js_1.default.create(data),
    updateBanner: (id, data) => Banner_js_1.default.findByIdAndUpdate(id, data, { new: true }),
    deleteBanner: (id) => Banner_js_1.default.findByIdAndUpdate(id, { isActive: false }),
    listCoupons: () => Coupon_js_1.default.find().sort({ createdAt: -1 }),
    createCoupon: (data) => Coupon_js_1.default.create(data),
    updateCoupon: (id, data) => Coupon_js_1.default.findByIdAndUpdate(id, data, { new: true }),
    deleteCoupon: (id) => Coupon_js_1.default.findByIdAndUpdate(id, { isActive: false }),
    listCommunityContent: (query) => {
        const filter = {};
        if (query.filter === "flagged")
            filter.isFlagged = true;
        else if (query.filter === "moderated")
            filter.isModerated = true;
        else if (query.filter === "deleted")
            filter.isDeleted = true;
        else if (query.filter === "clean") {
            filter.isFlagged = false;
            filter.isDeleted = false;
        }
        if (query.search) {
            const escaped = query.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            filter.$or = [
                { title: { $regex: escaped, $options: "i" } },
                { body: { $regex: escaped, $options: "i" } },
            ];
        }
        return (0, pagination_js_1.paginate)({
            model: CommunityQuestion_js_1.default,
            filter,
            query,
            populate: { path: "category", select: "name slug" },
            sort: { createdAt: -1 },
        });
    },
};
async function seedDefaultSettings() {
    const defaults = [
        { key: "default_commission_percent", value: "20", description: "Platform commission percentage" },
        { key: "default_price_per_minute", value: "10", description: "Default expert price per minute (INR)" },
        { key: "min_price_per_minute", value: "5", description: "Minimum price per minute" },
        { key: "max_price_per_minute", value: "100", description: "Maximum price per minute" },
        {
            key: "chat_retention_days",
            value: "30",
            description: "Auto-delete chat messages (and Cloudinary images) older than this many days",
        },
        {
            key: "notification_retention_days",
            value: "90",
            description: "Auto-delete notifications older than this many days",
        },
        {
            key: "call_recording_retention_days",
            value: "30",
            description: "Auto-delete call recordings from DB and Cloudinary older than this many days",
        },
    ];
    for (const setting of defaults) {
        // Only insert missing keys — never overwrite admin-configured values on restart
        await AdminSettings_js_1.default.findOneAndUpdate({ key: setting.key }, { $setOnInsert: setting }, { upsert: true });
    }
}
async function getRetentionDays(key, fallback) {
    const raw = await getSettingValue(key, String(fallback));
    const days = Number(raw);
    if (!Number.isFinite(days) || days < 1)
        return fallback;
    return Math.floor(days);
}
//# sourceMappingURL=admin.service.js.map