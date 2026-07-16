import User from "../models/User.js";
import Expert from "../models/Expert.js";
import Call from "../models/Call.js";
import Transaction from "../models/Transaction.js";
import Recharge from "../models/Recharge.js";
import Payout from "../models/Payout.js";
import Report from "../models/Report.js";
import Category from "../models/Category.js";
import Faq from "../models/Faq.js";
import Banner from "../models/Banner.js";
import Coupon from "../models/Coupon.js";
import AdminSettings from "../models/AdminSettings.js";
import CommunityQuestion from "../models/CommunityQuestion.js";
import CommunityComment from "../models/CommunityComment.js";
import { creditWallet } from "./wallet.service.js";
import { moderateContent } from "./moderation.service.js";
import {
  CallStatus,
  ExpertStatus,
  UserRole,
  ReportStatus,
  RechargeStatus,
  TransactionType,
} from "../types/index.js";
import { DEFAULT_COMMISSION_PERCENT } from "../utils/constants.js";
import { paginate } from "../utils/pagination.js";
import { NotFoundError, ValidationError } from "../utils/AppError.js";
import type { PaginationQuery } from "../types/index.js";

export async function getDashboardMetrics() {
  const [
    totalUsers,
    totalExperts,
    onlineExperts,
    activeCalls,
    totalRevenue,
    pendingReports,
    pendingExpertApprovals,
  ] = await Promise.all([
    User.countDocuments({ role: UserRole.USER }),
    Expert.countDocuments({ isApproved: true }),
    Expert.countDocuments({ status: ExpertStatus.ONLINE, isApproved: true }),
    Call.countDocuments({ status: CallStatus.ACTIVE }),
    Transaction.aggregate([
      { $match: { type: "recharge", status: "completed" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    Report.countDocuments({ status: ReportStatus.PENDING }),
    Expert.countDocuments({ isApproved: false }),
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

export async function getAnalytics(period: "week" | "month" | "year" = "week") {
  const days = period === "week" ? 7 : period === "month" ? 30 : 365;
  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0);
  startDate.setDate(startDate.getDate() - (days - 1));

  const dateFormat = period === "year" ? "%Y-%m" : "%Y-%m-%d";

  const [userSignupsRaw, rechargesRaw, callsRaw, revenueRaw] = await Promise.all([
    User.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: { $dateToString: { format: dateFormat, date: "$createdAt" } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    Recharge.aggregate([
      { $match: { status: RechargeStatus.PAID, createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: dateFormat, date: "$createdAt" } },
          count: { $sum: 1 },
          amount: { $sum: "$amount" },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Call.aggregate([
      { $match: { status: CallStatus.COMPLETED, createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: dateFormat, date: "$createdAt" } },
          count: { $sum: 1 },
          revenue: { $sum: "$totalCost" },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Transaction.aggregate([
      { $match: { type: "recharge", status: "completed", createdAt: { $gte: startDate } } },
      { $group: { _id: { $dateToString: { format: dateFormat, date: "$createdAt" } }, total: { $sum: "$amount" } } },
      { $sort: { _id: 1 } },
    ]),
  ]);

  const buckets = buildPeriodBuckets(startDate, period);

  return {
    userSignups: fillBuckets(buckets, userSignupsRaw, "count"),
    recharges: fillBuckets(buckets, rechargesRaw, "amount", { count: 0 }),
    calls: fillBuckets(buckets, callsRaw, "count", { revenue: 0 }),
    revenue: fillBuckets(buckets, revenueRaw, "total"),
    period,
  };
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function toDayKey(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function toMonthKey(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
}

/** Continuous day or month keys for the selected period so charts don't skip empty slots. */
function buildPeriodBuckets(startDate: Date, period: "week" | "month" | "year"): string[] {
  const keys: string[] = [];
  if (period === "year") {
    const cursor = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    const end = new Date();
    end.setDate(1);
    while (cursor <= end) {
      keys.push(toMonthKey(cursor));
      cursor.setMonth(cursor.getMonth() + 1);
    }
    return keys;
  }

  const cursor = new Date(startDate);
  const end = new Date();
  end.setHours(0, 0, 0, 0);
  while (cursor <= end) {
    keys.push(toDayKey(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return keys;
}

function fillBuckets(
  keys: string[],
  rows: Array<Record<string, unknown>>,
  primaryField: string,
  extras: Record<string, number> = {}
) {
  const map = new Map(rows.map((r) => [String(r._id), r]));
  return keys.map((key) => {
    const row = map.get(key);
    const out: Record<string, unknown> = { _id: key, [primaryField]: 0, ...extras };
    if (row) {
      for (const [k, v] of Object.entries(row)) {
        if (k === "_id") continue;
        out[k] = v;
      }
    }
    return out;
  });
}

export async function listUsers(query: PaginationQuery & { search?: string; role?: string }) {
  const filter: Record<string, unknown> = {};
  if (query.role) filter.role = query.role;
  if (query.search) {
    filter.$or = [
      { name: { $regex: query.search, $options: "i" } },
      { phone: { $regex: query.search, $options: "i" } },
      { email: { $regex: query.search, $options: "i" } },
    ];
  }

  return paginate({ model: User, filter, query, sort: { createdAt: -1 } });
}

export async function updateUser(userId: string, data: { isBlocked?: boolean; role?: UserRole }) {
  const user = await User.findByIdAndUpdate(userId, data, { new: true });
  if (!user) throw new NotFoundError("User");
  return user;
}

export async function listExperts(query: PaginationQuery & { approved?: string; search?: string }) {
  const filter: Record<string, unknown> = {};
  if (query.approved === "pending") filter.isApproved = false;
  else if (query.approved === "approved") filter.isApproved = true;

  if (query.search) {
    const escaped = query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = { $regex: escaped, $options: "i" };
    // Name/email/phone live on the linked User doc — resolve matching users first.
    const users = await User.find({
      $or: [{ name: regex }, { phone: regex }, { email: regex }],
    }).select("_id");
    filter.$or = [{ mobile: regex }, { userId: { $in: users.map((u) => u._id) } }];
  }

  return paginate({
    model: Expert,
    filter,
    query,
    populate: { path: "userId", select: "name phone email avatar isBlocked" },
    sort: { createdAt: -1 },
  });
}

export async function updateExpertByAdmin(
  expertId: string,
  data: {
    name?: string;
    bio?: string;
    experience?: number;
    categories?: string[];
    languages?: string[];
    pricePerMinute?: number;
    commissionPercent?: number;
  }
) {
  const expert = await Expert.findById(expertId);
  if (!expert) throw new NotFoundError("Expert");

  if (data.pricePerMinute !== undefined) {
    await assertPriceWithinLimits(data.pricePerMinute);
  }

  if (data.bio !== undefined) expert.bio = data.bio;
  if (data.experience !== undefined) expert.experience = data.experience;
  if (data.categories !== undefined) expert.categories = data.categories as never;
  if (data.languages !== undefined) expert.languages = data.languages;
  if (data.pricePerMinute !== undefined) expert.pricePerMinute = data.pricePerMinute;
  if (data.commissionPercent !== undefined) expert.commissionPercent = data.commissionPercent;
  await expert.save();

  if (data.name !== undefined) {
    await User.findByIdAndUpdate(expert.userId, { name: data.name });
  }

  return Expert.findById(expertId).populate("userId", "name phone email avatar isBlocked");
}

export async function approveExpert(
  expertId: string,
  data: { isApproved: boolean; rejectionReason?: string; pricePerMinute?: number; commissionPercent?: number }
) {
  const expert = await Expert.findById(expertId);
  if (!expert) throw new NotFoundError("Expert");

  if (data.pricePerMinute !== undefined) {
    await assertPriceWithinLimits(data.pricePerMinute);
  }

  expert.isApproved = data.isApproved;
  if (data.rejectionReason) expert.rejectionReason = data.rejectionReason;
  if (data.pricePerMinute !== undefined) expert.pricePerMinute = data.pricePerMinute;
  if (data.commissionPercent !== undefined) expert.commissionPercent = data.commissionPercent;
  if (data.isApproved) {
    expert.isVerified = true;
    await User.findByIdAndUpdate(expert.userId, { role: UserRole.EXPERT });
  } else {
    expert.isVerified = false;
    await User.findByIdAndUpdate(expert.userId, { role: UserRole.USER });
  }

  await expert.save();
  return expert;
}

export async function getTransactions(query: PaginationQuery & { type?: string; userId?: string }) {
  const filter: Record<string, unknown> = {};
  if (query.type) filter.type = query.type;
  if (query.userId) filter.userId = query.userId;

  return paginate({
    model: Transaction,
    filter,
    query,
    populate: { path: "userId", select: "name phone email" },
    sort: { createdAt: -1 },
  });
}

export async function listCalls(
  query: PaginationQuery & { status?: string; hasRecording?: string }
) {
  const filter: Record<string, unknown> = {};
  if (query.status) filter.status = query.status;
  if (query.hasRecording === "true") filter.recordingUrl = { $exists: true, $nin: [null, ""] };

  return paginate({
    model: Call,
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
export async function getCommissionReport(period: "week" | "month" | "year" = "month") {
  const days = period === "week" ? 7 : period === "month" ? 30 : 365;
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [callAgg, payoutAgg, refundAgg] = await Promise.all([
    Call.aggregate([
      { $match: { status: CallStatus.COMPLETED, endedAt: { $gte: startDate } } },
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
                    { $ifNull: ["$expert.commissionPercent", DEFAULT_COMMISSION_PERCENT] },
                  ],
                },
                100,
              ],
            },
          },
        },
      },
    ]),
    Payout.aggregate([
      { $match: { status: "completed", processedAt: { $gte: startDate } } },
      { $group: { _id: null, total: { $sum: "$netAmount" }, count: { $sum: 1 } } },
    ]),
    Transaction.aggregate([
      { $match: { type: "refund", status: "completed", createdAt: { $gte: startDate } } },
      { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
    ]),
  ]);

  const round = (n: number) => Math.round(n * 100) / 100;
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
export async function issueRefund(
  data: { userId: string; amount: number; description: string; callId?: string },
  adminId: string
): Promise<{ balanceAfter: number }> {
  const user = await User.findById(data.userId);
  if (!user) throw new NotFoundError("User");

  const result = await creditWallet(data.userId, data.amount, data.description, {
    type: TransactionType.REFUND,
    referenceType: data.callId ? "call" : "adjustment",
    referenceId: data.callId || adminId,
  });
  return { balanceAfter: result.balanceAfter };
}

/** Flag/unflag/hide a community question from the moderation queue. */
export async function moderateQuestion(
  questionId: string,
  data: { isFlagged?: boolean; isModerated?: boolean; isDeleted?: boolean }
) {
  const update: Record<string, unknown> = {};
  if (data.isFlagged !== undefined) update.isFlagged = data.isFlagged;
  if (data.isModerated !== undefined) update.isModerated = data.isModerated;
  if (data.isDeleted !== undefined) update.isDeleted = data.isDeleted;

  const question = await CommunityQuestion.findByIdAndUpdate(questionId, update, { new: true });
  if (!question) throw new NotFoundError("Question");
  return question;
}

/** Run AI moderation on a single question on demand and persist the verdict. */
export async function runAiModerationOnQuestion(questionId: string) {
  const question = await CommunityQuestion.findById(questionId);
  if (!question) throw new NotFoundError("Question");

  const moderation = await moderateContent(question.body || question.title);
  question.isModerated = true;
  question.isFlagged = moderation.isFlagged && moderation.confidence > 0.5;
  await question.save();

  return { question, moderation };
}

export async function getReports(query: PaginationQuery & { status?: string }) {
  const filter: Record<string, unknown> = {};
  if (query.status) filter.status = query.status;

  return paginate({
    model: Report,
    filter,
    query,
    populate: { path: "reporterId", select: "name" },
    sort: { createdAt: -1 },
  });
}

export async function resolveReport(
  reportId: string,
  adminId: string,
  data: { status: ReportStatus; action?: string }
) {
  const report = await Report.findByIdAndUpdate(
    reportId,
    { ...data, reviewedBy: adminId, reviewedAt: new Date() },
    { new: true }
  );
  if (!report) throw new NotFoundError("Report");
  return report;
}

export async function getSettings(): Promise<Record<string, string>> {
  const settings = await AdminSettings.find();
  const map: Record<string, string> = {};
  settings.forEach((s) => { map[s.key] = s.value; });
  return map;
}

export async function updateSettings(
  settings: Array<{ key: string; value: string; description?: string }>,
  adminId: string
): Promise<void> {
  for (const setting of settings) {
    await AdminSettings.findOneAndUpdate(
      { key: setting.key },
      { value: setting.value, description: setting.description, updatedBy: adminId },
      { upsert: true }
    );
  }
}

export async function getSettingValue(key: string, defaultValue: string): Promise<string> {
  const setting = await AdminSettings.findOne({ key });
  return setting?.value ?? defaultValue;
}

export async function getDefaultPricePerMinute(): Promise<number> {
  const val = await getSettingValue("default_price_per_minute", "10");
  return Number(val);
}

export async function getDefaultCommission(): Promise<number> {
  const val = await getSettingValue("default_commission_percent", String(DEFAULT_COMMISSION_PERCENT));
  return Number(val);
}

export async function getPriceLimits(): Promise<{ min: number; max: number }> {
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
export async function assertPriceWithinLimits(pricePerMinute: number): Promise<void> {
  const { min, max } = await getPriceLimits();
  if (pricePerMinute < min || pricePerMinute > max) {
    throw new ValidationError("Validation failed", {
      pricePerMinute: [`Price must be between ₹${min} and ₹${max} per minute`],
    });
  }
}

// CMS helpers
export const cmsService = {
  listCategories: () => Category.find({ isActive: true }).sort({ order: 1 }),
  createCategory: (data: Record<string, unknown>) => Category.create(data),
  updateCategory: (id: string, data: Record<string, unknown>) => Category.findByIdAndUpdate(id, data, { new: true }),
  deleteCategory: (id: string) => Category.findByIdAndUpdate(id, { isActive: false }),

  listFaqs: () => Faq.find({ isActive: true }).sort({ order: 1 }),
  createFaq: (data: Record<string, unknown>) => Faq.create(data),
  updateFaq: (id: string, data: Record<string, unknown>) => Faq.findByIdAndUpdate(id, data, { new: true }),
  deleteFaq: (id: string) => Faq.findByIdAndUpdate(id, { isActive: false }),

  listBanners: () => Banner.find({ isActive: true, startDate: { $lte: new Date() }, endDate: { $gte: new Date() } }),
  createBanner: (data: Record<string, unknown>) => Banner.create(data),
  updateBanner: (id: string, data: Record<string, unknown>) => Banner.findByIdAndUpdate(id, data, { new: true }),
  deleteBanner: (id: string) => Banner.findByIdAndUpdate(id, { isActive: false }),

  listCoupons: () => Coupon.find().sort({ createdAt: -1 }),
  createCoupon: (data: Record<string, unknown>) => Coupon.create(data),
  updateCoupon: (id: string, data: Record<string, unknown>) => Coupon.findByIdAndUpdate(id, data, { new: true }),
  deleteCoupon: (id: string) => Coupon.findByIdAndUpdate(id, { isActive: false }),

  listCommunityContent: (query: PaginationQuery & { filter?: string; search?: string }) => {
    const filter: Record<string, unknown> = {};
    if (query.filter === "flagged") filter.isFlagged = true;
    else if (query.filter === "moderated") filter.isModerated = true;
    else if (query.filter === "deleted") filter.isDeleted = true;
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
    return paginate({
      model: CommunityQuestion,
      filter,
      query,
      populate: { path: "category", select: "name slug" },
      sort: { createdAt: -1 },
    });
  },
};

export async function seedDefaultSettings(): Promise<void> {
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
    await AdminSettings.findOneAndUpdate(
      { key: setting.key },
      { $setOnInsert: setting },
      { upsert: true }
    );
  }
}

export async function getRetentionDays(
  key: "chat_retention_days" | "notification_retention_days" | "call_recording_retention_days",
  fallback: number
): Promise<number> {
  const raw = await getSettingValue(key, String(fallback));
  const days = Number(raw);
  if (!Number.isFinite(days) || days < 1) return fallback;
  return Math.floor(days);
}
