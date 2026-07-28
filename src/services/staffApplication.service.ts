import StaffApplication from "../models/StaffApplication.js";
import Expert from "../models/Expert.js";
import User from "../models/User.js";
import AdminSettings from "../models/AdminSettings.js";
import { getRazorpay } from "../config/razorpay.js";
import { verifyPaymentSignature } from "./razorpay.service.js";
import {
  assertPriceWithinLimits,
  getDefaultCommission,
  getDefaultPricePerMinute,
} from "./admin.service.js";
import { StaffApplicationStatus, ExpertStatus, UserRole } from "../types/index.js";
import {
  ConflictError,
  NotFoundError,
  ValidationError,
  ForbiddenError,
} from "../utils/AppError.js";
import { DEFAULT_STAFF_APPLICATION_FEE } from "../utils/constants.js";
import { normalizePhone, phoneLookupVariants } from "../utils/phone.js";
import { paginate } from "../utils/pagination.js";
import type { PaginationQuery } from "../types/index.js";
import type { IUser } from "../models/User.js";
import type { IExpert } from "../models/Expert.js";

async function getStaffFee(): Promise<number> {
  const setting = await AdminSettings.findOne({ key: "staff_application_fee" });
  if (setting?.value !== undefined && setting?.value !== null && setting.value !== "") {
    const n = typeof setting.value === "number" ? setting.value : Number(setting.value);
    if (Number.isFinite(n) && n >= 0) return n;
  }
  return DEFAULT_STAFF_APPLICATION_FEE;
}

/** Public amount shown on become-staff / call-button activation. */
export async function getStaffApplicationFee(): Promise<number> {
  return getStaffFee();
}

/** Create or update Expert so the user appears on Call / Chat (approved call button). */
export async function ensureApprovedExpertForUser(
  user: IUser,
  opts: { pricePerMinute?: number; commissionPercent?: number } = {}
): Promise<IExpert> {
  const pricePerMinute = opts.pricePerMinute ?? (await getDefaultPricePerMinute());
  const commissionPercent = opts.commissionPercent ?? (await getDefaultCommission());
  await assertPriceWithinLimits(pricePerMinute);

  const mobileRaw = user.phone?.trim() || `staff_${user._id.toString()}`;
  const mobile = mobileRaw.startsWith("google_") || mobileRaw.startsWith("staff_")
    ? mobileRaw
    : normalizePhone(mobileRaw);

  let expert =
    (await Expert.findOne({ userId: user._id })) ||
    (await Expert.findOne({ mobile: { $in: phoneLookupVariants(mobile) } }));

  if (!expert) {
    try {
      expert = await Expert.create({
        userId: user._id,
        mobile,
        bio: "",
        experience: 0,
        categories: [],
        languages: ["English"],
        pricePerMinute,
        commissionPercent,
        status: ExpertStatus.OFFLINE,
        isApproved: true,
        isVerified: true,
      });
    } catch (err) {
      // Race / duplicate key — load and update instead
      expert =
        (await Expert.findOne({ userId: user._id })) ||
        (await Expert.findOne({ mobile: { $in: phoneLookupVariants(mobile) } }));
      if (!expert) throw err;
    }
  }

  // Ensure link + approval flags (covers old apps approved without Expert)
  expert.userId = user._id;
  if (!expert.mobile) expert.mobile = mobile;
  expert.isApproved = true;
  expert.isVerified = true;
  expert.pricePerMinute = pricePerMinute;
  expert.commissionPercent = commissionPercent;
  expert.rejectionReason = undefined;
  await expert.save();

  if (user.role !== UserRole.ADMIN) {
    user.role = UserRole.USER;
    await user.save();
  }

  return expert;
}

export async function applyForStaff(userId: string) {
  const user = await User.findById(userId);
  if (!user || user.isBlocked) throw new NotFoundError("User");

  const existingExpert = await Expert.findOne({ userId });
  if (existingExpert?.isApproved) {
    throw new ConflictError("You already have an approved staff profile");
  }

  const open = await StaffApplication.findOne({
    userId,
    status: {
      $in: [
        StaffApplicationStatus.PENDING_PAYMENT,
        StaffApplicationStatus.PENDING_REVIEW,
      ],
    },
  });
  if (open) {
    return open;
  }

  const feeAmount = await getStaffFee();
  const razorpay = getRazorpay();
  const order = await razorpay.orders.create({
    amount: Math.round(feeAmount * 100),
    currency: "INR",
    receipt: `staff_${userId.slice(-6)}_${Date.now()}`,
    notes: { userId, type: "staff_application" },
  });

  const application = await StaffApplication.create({
    userId,
    status: StaffApplicationStatus.PENDING_PAYMENT,
    feeAmount,
    razorpayOrderId: order.id,
  });

  return {
    application,
    payment: {
      orderId: order.id,
      amount: feeAmount,
      currency: "INR",
      key: process.env.RAZORPAY_KEY_ID,
    },
  };
}

export async function verifyStaffApplicationPayment(
  userId: string,
  data: { razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string }
) {
  const application = await StaffApplication.findOne({
    userId,
    razorpayOrderId: data.razorpayOrderId,
  });
  if (!application) throw new NotFoundError("Application");
  if (application.status !== StaffApplicationStatus.PENDING_PAYMENT) {
    throw new ConflictError("Application is not awaiting payment");
  }

  const ok = verifyPaymentSignature(
    data.razorpayOrderId,
    data.razorpayPaymentId,
    data.razorpaySignature
  );
  if (!ok) throw new ValidationError("Invalid payment signature");

  application.razorpayPaymentId = data.razorpayPaymentId;
  application.razorpaySignature = data.razorpaySignature;
  application.status = StaffApplicationStatus.PENDING_REVIEW;
  await application.save();
  return application;
}

export async function getMyStaffApplication(userId: string) {
  return StaffApplication.findOne({ userId }).sort({ createdAt: -1 });
}

export async function listStaffApplications(
  query: PaginationQuery & { status?: string }
) {
  const filter: Record<string, unknown> = {};
  if (query.status) filter.status = query.status;
  return paginate({
    model: StaffApplication,
    filter,
    query,
    sort: { createdAt: -1 },
    populate: { path: "userId", select: "+realName name phone email avatar city state country" },
  });
}

export async function reviewStaffApplication(
  applicationId: string,
  adminId: string,
  data: {
    approve: boolean;
    rejectionReason?: string;
    pricePerMinute?: number;
    commissionPercent?: number;
  }
) {
  const application = await StaffApplication.findById(applicationId);
  if (!application) throw new NotFoundError("Application");

  // Allow repair: already-approved apps that never got an Expert record
  const canReview =
    application.status === StaffApplicationStatus.PENDING_REVIEW ||
    (data.approve && application.status === StaffApplicationStatus.APPROVED);

  if (!canReview) {
    throw new ConflictError("Application is not pending review");
  }

  const user = await User.findById(application.userId);
  if (!user) throw new NotFoundError("User");

  if (!data.approve) {
    application.status = StaffApplicationStatus.REJECTED;
    application.rejectionReason = data.rejectionReason || "Rejected by admin";
    application.reviewedAt = new Date();
    application.reviewedBy = adminId as unknown as import("mongoose").Types.ObjectId;
    await application.save();

    // Revoke call button if they had a profile
    await Expert.findOneAndUpdate(
      { userId: user._id },
      { isApproved: false, isVerified: false, rejectionReason: application.rejectionReason }
    );

    return { application, expert: null };
  }

  const expert = await ensureApprovedExpertForUser(user, {
    pricePerMinute: data.pricePerMinute,
    commissionPercent: data.commissionPercent,
  });

  application.status = StaffApplicationStatus.APPROVED;
  application.rejectionReason = undefined;
  application.reviewedAt = new Date();
  application.reviewedBy = adminId as unknown as import("mongoose").Types.ObjectId;
  await application.save();

  return { application, expert };
}

/** Backfill Expert profiles for every approved staff application (fixes empty Call/Chat). */
export async function syncExpertsFromApprovedApplications() {
  const apps = await StaffApplication.find({
    status: StaffApplicationStatus.APPROVED,
  });

  const created: string[] = [];
  const updated: string[] = [];
  const failed: Array<{ applicationId: string; error: string }> = [];

  for (const app of apps) {
    try {
      const user = await User.findById(app.userId);
      if (!user) {
        failed.push({ applicationId: app._id.toString(), error: "User not found" });
        continue;
      }
      const before = await Expert.findOne({ userId: user._id });
      await ensureApprovedExpertForUser(user, {});
      if (before) updated.push(user._id.toString());
      else created.push(user._id.toString());
    } catch (e) {
      failed.push({
        applicationId: app._id.toString(),
        error: e instanceof Error ? e.message : "Unknown error",
      });
    }
  }

  return {
    approvedApplications: apps.length,
    expertsCreated: created.length,
    expertsUpdated: updated.length,
    failed,
  };
}

export async function assertCanApply(userId: string) {
  const expert = await Expert.findOne({ userId, isApproved: true });
  if (expert) throw new ForbiddenError("Already a staff member");
}
