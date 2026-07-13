import Expert from "../models/Expert.js";
import User from "../models/User.js";
import Category from "../models/Category.js";
import Call from "../models/Call.js";
import { CallStatus } from "../types/index.js";
import { getDefaultCommission, getDefaultPricePerMinute } from "./admin.service.js";
import { getExpertEarningsSummary, getExpertPayouts, createPayoutRequest } from "./payout.service.js";
import { paginate } from "../utils/pagination.js";
import { ExpertStatus, UserRole } from "../types/index.js";
import { generateDummyAvatar } from "../utils/constants.js";
import { ConflictError, NotFoundError, ForbiddenError, AuthError } from "../utils/AppError.js";
import type { PaginationQuery } from "../types/index.js";
import type { IExpert } from "../models/Expert.js";
import type { AvailabilitySlot } from "../types/index.js";

/** Admin-only: create expert account (login enabled only after approval). */
export async function createExpertByAdmin(data: {
  mobile: string;
  name: string;
  bio?: string;
  experience?: number;
  categories: string[];
  languages?: string[];
  pricePerMinute?: number;
  commissionPercent?: number;
  bankDetails?: IExpert["bankDetails"];
}): Promise<IExpert> {
  const existingExpert = await Expert.findOne({ mobile: data.mobile });
  if (existingExpert) throw new ConflictError("Expert with this mobile number already exists");

  const existingUser = await User.findOne({ phone: data.mobile });
  if (existingUser) throw new ConflictError("Mobile number already registered");

  const defaultPrice = data.pricePerMinute ?? await getDefaultPricePerMinute();
  const defaultCommission = data.commissionPercent ?? await getDefaultCommission();

  const user = await User.create({
    phone: data.mobile,
    name: data.name,
    avatar: generateDummyAvatar(data.mobile),
    isVerified: false,
    role: UserRole.USER,
  });

  const expert = await Expert.create({
    userId: user._id,
    mobile: data.mobile,
    bio: data.bio || "",
    experience: data.experience || 0,
    categories: data.categories,
    languages: data.languages || ["English"],
    pricePerMinute: defaultPrice,
    commissionPercent: defaultCommission,
    bankDetails: data.bankDetails,
    isApproved: false,
    isVerified: false,
  });

  return expert;
}

export async function findExpertByMobile(mobile: string): Promise<IExpert | null> {
  return Expert.findOne({ mobile });
}

export async function assertExpertCanLogin(mobile: string): Promise<IExpert> {
  const expert = await Expert.findOne({ mobile });
  if (!expert) {
    throw new AuthError("No expert account found for this mobile number. Contact admin to register.");
  }
  if (!expert.isApproved) {
    throw new AuthError("Expert account is pending admin approval");
  }
  return expert;
}

export async function browseExperts(query: PaginationQuery & {
  category?: string;
  search?: string;
  language?: string;
  minRating?: number;
  status?: ExpertStatus;
  sort?: string;
}) {
  const filter: Record<string, unknown> = { isApproved: true };

  if (query.category) filter.categories = query.category;
  if (query.language) filter.languages = query.language;
  if (query.minRating) filter.rating = { $gte: query.minRating };
  if (query.status) filter.status = query.status;

  if (query.search) {
    const term = query.search.trim();
    if (term) {
      const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const matchingUsers = await User.find({ name: { $regex: escaped, $options: "i" } }).select("_id");
      const userIds = matchingUsers.map((u) => u._id);
      const or: Record<string, unknown>[] = [
        { bio: { $regex: escaped, $options: "i" } },
        { languages: { $regex: escaped, $options: "i" } },
      ];
      if (userIds.length > 0) or.push({ userId: { $in: userIds } });
      filter.$or = or;
    }
  }

  let sort: Record<string, 1 | -1> = { rating: -1 };
  if (query.sort === "price") sort = { pricePerMinute: query.order === "asc" ? 1 : -1 };
  if (query.sort === "experience") sort = { experience: -1 };

  return paginate({
    model: Expert,
    filter,
    query,
    populate: [
      { path: "userId", select: "name avatar" },
      { path: "categories", select: "name slug icon" },
    ],
    sort,
  });
}

export async function getExpertProfile(expertId: string) {
  const expert = await Expert.findOne({ _id: expertId, isApproved: true })
    .populate("userId", "name avatar")
    .populate("categories", "name slug icon");

  if (!expert) throw new NotFoundError("Expert");
  return expert;
}

export async function getExpertReviews(expertId: string, limit = 10) {
  const expert = await Expert.findOne({ _id: expertId, isApproved: true });
  if (!expert) throw new NotFoundError("Expert");

  const reviews = await Call.find({
    expertId,
    status: CallStatus.COMPLETED,
    rating: { $exists: true, $ne: null },
  })
    .select("rating review createdAt")
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  return reviews.map((r) => ({
    rating: r.rating as number,
    review: r.review || "",
    createdAt: r.createdAt,
    authorName: "Anonymous User",
  }));
}

export async function updateExpertProfile(
  userId: string,
  data: Partial<{
    bio: string;
    experience: number;
    categories: string[];
    languages: string[];
    bankDetails: IExpert["bankDetails"];
  }>
): Promise<IExpert> {
  const expert = await Expert.findOne({ userId });
  if (!expert) throw new NotFoundError("Expert profile");

  Object.assign(expert, data);
  await expert.save();
  return expert;
}

export async function updateExpertStatus(userId: string, status: ExpertStatus): Promise<IExpert> {
  const expert = await Expert.findOne({ userId, isApproved: true });
  if (!expert) throw new ForbiddenError("Approved expert profile required");

  expert.status = status;
  await expert.save();
  return expert;
}

export async function updateAvailability(
  userId: string,
  schedule: AvailabilitySlot[]
): Promise<IExpert> {
  const expert = await Expert.findOne({ userId });
  if (!expert) throw new NotFoundError("Expert profile");

  expert.availabilitySchedule = schedule;
  await expert.save();
  return expert;
}

export async function getExpertDashboard(userId: string) {
  const expert = await Expert.findOne({ userId }).populate("userId", "name avatar");
  if (!expert) throw new NotFoundError("Expert profile");

  const earnings = await getExpertEarningsSummary(expert._id.toString());
  return { expert, earnings };
}

export async function getExpertEarnings(userId: string, query: PaginationQuery) {
  const expert = await Expert.findOne({ userId });
  if (!expert) throw new NotFoundError("Expert profile");

  return getExpertPayouts(expert._id.toString(), query);
}

export async function requestWithdrawal(userId: string) {
  const expert = await Expert.findOne({ userId, isApproved: true });
  if (!expert) throw new ForbiddenError();

  if (!expert.bankDetails?.accountNumber) {
    throw new ForbiddenError("Bank details required for withdrawal");
  }

  return createPayoutRequest(expert._id.toString());
}

export async function getPublicCategories() {
  return Category.find({ isActive: true }).sort({ order: 1 }).select("name slug description icon");
}
