import User from "../models/User.js";
import Expert from "../models/Expert.js";
import Call from "../models/Call.js";
import Transaction from "../models/Transaction.js";
import Recharge from "../models/Recharge.js";
import Report from "../models/Report.js";
import Category from "../models/Category.js";
import Faq from "../models/Faq.js";
import Banner from "../models/Banner.js";
import Coupon from "../models/Coupon.js";
import AdminSettings from "../models/AdminSettings.js";
import CommunityQuestion from "../models/CommunityQuestion.js";
import CommunityComment from "../models/CommunityComment.js";
import { CallStatus, ExpertStatus, UserRole, ReportStatus, RechargeStatus } from "../types/index.js";
import { DEFAULT_COMMISSION_PERCENT } from "../utils/constants.js";
import { paginate } from "../utils/pagination.js";
import { NotFoundError } from "../utils/AppError.js";
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
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [userSignups, recharges, calls, revenue] = await Promise.all([
    User.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    Recharge.aggregate([
      { $match: { status: RechargeStatus.PAID, createdAt: { $gte: startDate } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 }, amount: { $sum: "$amount" } } },
      { $sort: { _id: 1 } },
    ]),
    Call.aggregate([
      { $match: { status: CallStatus.COMPLETED, createdAt: { $gte: startDate } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 }, revenue: { $sum: "$totalCost" } } },
      { $sort: { _id: 1 } },
    ]),
    Transaction.aggregate([
      { $match: { type: "recharge", status: "completed", createdAt: { $gte: startDate } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, total: { $sum: "$amount" } } },
      { $sort: { _id: 1 } },
    ]),
  ]);

  return { userSignups, recharges, calls, revenue, period };
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
    filter.$or = [
      { mobile: { $regex: query.search, $options: "i" } },
    ];
  }

  return paginate({
    model: Expert,
    filter,
    query,
    populate: { path: "userId", select: "name phone email avatar isBlocked" },
    sort: { createdAt: -1 },
  });
}

export async function approveExpert(
  expertId: string,
  data: { isApproved: boolean; rejectionReason?: string; pricePerMinute?: number; commissionPercent?: number }
) {
  const expert = await Expert.findById(expertId);
  if (!expert) throw new NotFoundError("Expert");

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

  listCommunityContent: (query: PaginationQuery) =>
    paginate({ model: CommunityQuestion, filter: {}, query, sort: { createdAt: -1 } }),
};

export async function seedDefaultSettings(): Promise<void> {
  const defaults = [
    { key: "default_commission_percent", value: "20", description: "Platform commission percentage" },
    { key: "default_price_per_minute", value: "10", description: "Default expert price per minute (INR)" },
    { key: "min_price_per_minute", value: "5", description: "Minimum price per minute" },
    { key: "max_price_per_minute", value: "100", description: "Maximum price per minute" },
  ];

  for (const setting of defaults) {
    await AdminSettings.findOneAndUpdate({ key: setting.key }, setting, { upsert: true });
  }
}
