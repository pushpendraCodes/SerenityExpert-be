"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureApprovedExpertForUser = ensureApprovedExpertForUser;
exports.applyForStaff = applyForStaff;
exports.verifyStaffApplicationPayment = verifyStaffApplicationPayment;
exports.getMyStaffApplication = getMyStaffApplication;
exports.listStaffApplications = listStaffApplications;
exports.reviewStaffApplication = reviewStaffApplication;
exports.syncExpertsFromApprovedApplications = syncExpertsFromApprovedApplications;
exports.assertCanApply = assertCanApply;
const StaffApplication_js_1 = __importDefault(require("../models/StaffApplication.js"));
const Expert_js_1 = __importDefault(require("../models/Expert.js"));
const User_js_1 = __importDefault(require("../models/User.js"));
const AdminSettings_js_1 = __importDefault(require("../models/AdminSettings.js"));
const razorpay_js_1 = require("../config/razorpay.js");
const razorpay_service_js_1 = require("./razorpay.service.js");
const admin_service_js_1 = require("./admin.service.js");
const index_js_1 = require("../types/index.js");
const AppError_js_1 = require("../utils/AppError.js");
const constants_js_1 = require("../utils/constants.js");
const phone_js_1 = require("../utils/phone.js");
const pagination_js_1 = require("../utils/pagination.js");
async function getStaffFee() {
    const setting = await AdminSettings_js_1.default.findOne({ key: "staff_application_fee" });
    const value = setting?.value;
    if (typeof value === "number" && value > 0)
        return value;
    if (typeof value === "string" && Number(value) > 0)
        return Number(value);
    return constants_js_1.DEFAULT_STAFF_APPLICATION_FEE;
}
/** Create or update Expert so the user appears on Call / Chat (approved call button). */
async function ensureApprovedExpertForUser(user, opts = {}) {
    const pricePerMinute = opts.pricePerMinute ?? (await (0, admin_service_js_1.getDefaultPricePerMinute)());
    const commissionPercent = opts.commissionPercent ?? (await (0, admin_service_js_1.getDefaultCommission)());
    await (0, admin_service_js_1.assertPriceWithinLimits)(pricePerMinute);
    const mobileRaw = user.phone?.trim() || `staff_${user._id.toString()}`;
    const mobile = mobileRaw.startsWith("google_") || mobileRaw.startsWith("staff_")
        ? mobileRaw
        : (0, phone_js_1.normalizePhone)(mobileRaw);
    let expert = (await Expert_js_1.default.findOne({ userId: user._id })) ||
        (await Expert_js_1.default.findOne({ mobile: { $in: (0, phone_js_1.phoneLookupVariants)(mobile) } }));
    if (!expert) {
        try {
            expert = await Expert_js_1.default.create({
                userId: user._id,
                mobile,
                bio: "",
                experience: 0,
                categories: [],
                languages: ["English"],
                pricePerMinute,
                commissionPercent,
                status: index_js_1.ExpertStatus.OFFLINE,
                isApproved: true,
                isVerified: true,
            });
        }
        catch (err) {
            // Race / duplicate key — load and update instead
            expert =
                (await Expert_js_1.default.findOne({ userId: user._id })) ||
                    (await Expert_js_1.default.findOne({ mobile: { $in: (0, phone_js_1.phoneLookupVariants)(mobile) } }));
            if (!expert)
                throw err;
        }
    }
    // Ensure link + approval flags (covers old apps approved without Expert)
    expert.userId = user._id;
    if (!expert.mobile)
        expert.mobile = mobile;
    expert.isApproved = true;
    expert.isVerified = true;
    expert.pricePerMinute = pricePerMinute;
    expert.commissionPercent = commissionPercent;
    expert.rejectionReason = undefined;
    await expert.save();
    if (user.role !== index_js_1.UserRole.ADMIN) {
        user.role = index_js_1.UserRole.USER;
        await user.save();
    }
    return expert;
}
async function applyForStaff(userId) {
    const user = await User_js_1.default.findById(userId);
    if (!user || user.isBlocked)
        throw new AppError_js_1.NotFoundError("User");
    const existingExpert = await Expert_js_1.default.findOne({ userId });
    if (existingExpert?.isApproved) {
        throw new AppError_js_1.ConflictError("You already have an approved staff profile");
    }
    const open = await StaffApplication_js_1.default.findOne({
        userId,
        status: {
            $in: [
                index_js_1.StaffApplicationStatus.PENDING_PAYMENT,
                index_js_1.StaffApplicationStatus.PENDING_REVIEW,
            ],
        },
    });
    if (open) {
        return open;
    }
    const feeAmount = await getStaffFee();
    const razorpay = (0, razorpay_js_1.getRazorpay)();
    const order = await razorpay.orders.create({
        amount: Math.round(feeAmount * 100),
        currency: "INR",
        receipt: `staff_${userId.slice(-6)}_${Date.now()}`,
        notes: { userId, type: "staff_application" },
    });
    const application = await StaffApplication_js_1.default.create({
        userId,
        status: index_js_1.StaffApplicationStatus.PENDING_PAYMENT,
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
async function verifyStaffApplicationPayment(userId, data) {
    const application = await StaffApplication_js_1.default.findOne({
        userId,
        razorpayOrderId: data.razorpayOrderId,
    });
    if (!application)
        throw new AppError_js_1.NotFoundError("Application");
    if (application.status !== index_js_1.StaffApplicationStatus.PENDING_PAYMENT) {
        throw new AppError_js_1.ConflictError("Application is not awaiting payment");
    }
    const ok = (0, razorpay_service_js_1.verifyPaymentSignature)(data.razorpayOrderId, data.razorpayPaymentId, data.razorpaySignature);
    if (!ok)
        throw new AppError_js_1.ValidationError("Invalid payment signature");
    application.razorpayPaymentId = data.razorpayPaymentId;
    application.razorpaySignature = data.razorpaySignature;
    application.status = index_js_1.StaffApplicationStatus.PENDING_REVIEW;
    await application.save();
    return application;
}
async function getMyStaffApplication(userId) {
    return StaffApplication_js_1.default.findOne({ userId }).sort({ createdAt: -1 });
}
async function listStaffApplications(query) {
    const filter = {};
    if (query.status)
        filter.status = query.status;
    return (0, pagination_js_1.paginate)({
        model: StaffApplication_js_1.default,
        filter,
        query,
        sort: { createdAt: -1 },
        populate: { path: "userId", select: "name phone email avatar city state country" },
    });
}
async function reviewStaffApplication(applicationId, adminId, data) {
    const application = await StaffApplication_js_1.default.findById(applicationId);
    if (!application)
        throw new AppError_js_1.NotFoundError("Application");
    // Allow repair: already-approved apps that never got an Expert record
    const canReview = application.status === index_js_1.StaffApplicationStatus.PENDING_REVIEW ||
        (data.approve && application.status === index_js_1.StaffApplicationStatus.APPROVED);
    if (!canReview) {
        throw new AppError_js_1.ConflictError("Application is not pending review");
    }
    const user = await User_js_1.default.findById(application.userId);
    if (!user)
        throw new AppError_js_1.NotFoundError("User");
    if (!data.approve) {
        application.status = index_js_1.StaffApplicationStatus.REJECTED;
        application.rejectionReason = data.rejectionReason || "Rejected by admin";
        application.reviewedAt = new Date();
        application.reviewedBy = adminId;
        await application.save();
        // Revoke call button if they had a profile
        await Expert_js_1.default.findOneAndUpdate({ userId: user._id }, { isApproved: false, isVerified: false, rejectionReason: application.rejectionReason });
        return { application, expert: null };
    }
    const expert = await ensureApprovedExpertForUser(user, {
        pricePerMinute: data.pricePerMinute,
        commissionPercent: data.commissionPercent,
    });
    application.status = index_js_1.StaffApplicationStatus.APPROVED;
    application.rejectionReason = undefined;
    application.reviewedAt = new Date();
    application.reviewedBy = adminId;
    await application.save();
    return { application, expert };
}
/** Backfill Expert profiles for every approved staff application (fixes empty Call/Chat). */
async function syncExpertsFromApprovedApplications() {
    const apps = await StaffApplication_js_1.default.find({
        status: index_js_1.StaffApplicationStatus.APPROVED,
    });
    const created = [];
    const updated = [];
    const failed = [];
    for (const app of apps) {
        try {
            const user = await User_js_1.default.findById(app.userId);
            if (!user) {
                failed.push({ applicationId: app._id.toString(), error: "User not found" });
                continue;
            }
            const before = await Expert_js_1.default.findOne({ userId: user._id });
            await ensureApprovedExpertForUser(user, {});
            if (before)
                updated.push(user._id.toString());
            else
                created.push(user._id.toString());
        }
        catch (e) {
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
async function assertCanApply(userId) {
    const expert = await Expert_js_1.default.findOne({ userId, isApproved: true });
    if (expert)
        throw new AppError_js_1.ForbiddenError("Already a staff member");
}
//# sourceMappingURL=staffApplication.service.js.map