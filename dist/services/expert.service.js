"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createExpertByAdmin = createExpertByAdmin;
exports.findExpertByMobile = findExpertByMobile;
exports.assertExpertCanLogin = assertExpertCanLogin;
exports.browseExperts = browseExperts;
exports.getExpertProfile = getExpertProfile;
exports.getExpertReviews = getExpertReviews;
exports.updateExpertProfile = updateExpertProfile;
exports.updateExpertStatus = updateExpertStatus;
exports.getExpertDashboard = getExpertDashboard;
exports.getExpertEarnings = getExpertEarnings;
exports.getPublicCategories = getPublicCategories;
const Expert_js_1 = __importDefault(require("../models/Expert.js"));
const User_js_1 = __importDefault(require("../models/User.js"));
const Category_js_1 = __importDefault(require("../models/Category.js"));
const Call_js_1 = __importDefault(require("../models/Call.js"));
const index_js_1 = require("../types/index.js");
const admin_service_js_1 = require("./admin.service.js");
const payout_service_js_1 = require("./payout.service.js");
const pagination_js_1 = require("../utils/pagination.js");
const index_js_2 = require("../types/index.js");
const constants_js_1 = require("../utils/constants.js");
const AppError_js_1 = require("../utils/AppError.js");
const phone_js_1 = require("../utils/phone.js");
/** Admin-only: create staff account (approved by default so they can log in to staff portal). */
async function createExpertByAdmin(data) {
    const normalizedMobile = (0, phone_js_1.normalizePhone)(data.mobile);
    const existingExpert = await Expert_js_1.default.findOne({
        mobile: { $in: (0, phone_js_1.phoneLookupVariants)(data.mobile) },
    });
    if (existingExpert)
        throw new AppError_js_1.ConflictError("Staff with this mobile number already exists");
    const defaultPrice = data.pricePerMinute ?? (await (0, admin_service_js_1.getDefaultPricePerMinute)());
    const defaultCommission = data.commissionPercent ?? (await (0, admin_service_js_1.getDefaultCommission)());
    await (0, admin_service_js_1.assertPriceWithinLimits)(defaultPrice);
    const dummyName = (data.name || "").trim() || (0, constants_js_1.generateDummyUsername)();
    const realName = data.realName?.trim() || undefined;
    const gender = data.gender;
    const dob = data.dob ? new Date(data.dob) : undefined;
    const country = data.country?.trim() || undefined;
    const city = data.city?.trim() || undefined;
    const state = data.state?.trim() || undefined;
    const profileCompleted = Boolean(realName && gender && dob && country && city && state);
    // Dual portal: reuse existing user account if this phone already signed up on the website
    let user = await User_js_1.default.findOne({ phone: { $in: (0, phone_js_1.phoneLookupVariants)(data.mobile) } });
    if (!user) {
        user = await User_js_1.default.create({
            phone: normalizedMobile,
            name: dummyName,
            realName,
            gender,
            dob,
            country,
            city,
            state,
            avatar: (0, constants_js_1.generateDummyAvatar)(dummyName || normalizedMobile),
            isVerified: true,
            role: index_js_2.UserRole.USER,
            profileCompleted,
        });
    }
    else {
        const linked = await Expert_js_1.default.findOne({ userId: user._id });
        if (linked)
            throw new AppError_js_1.ConflictError("This user already has a staff profile");
        if (dummyName && user.name !== dummyName)
            user.name = dummyName;
        if (realName)
            user.realName = realName;
        if (gender)
            user.gender = gender;
        if (dob)
            user.dob = dob;
        if (country)
            user.country = country;
        if (city)
            user.city = city;
        if (state)
            user.state = state;
        if (profileCompleted)
            user.profileCompleted = true;
        await user.save();
    }
    const approve = data.approveImmediately !== false;
    const expert = await Expert_js_1.default.create({
        userId: user._id,
        mobile: normalizedMobile,
        bio: data.bio || "",
        experience: data.experience || 0,
        categories: data.categories || [],
        languages: data.languages || ["English"],
        pricePerMinute: defaultPrice,
        commissionPercent: defaultCommission,
        bankDetails: data.bankDetails,
        status: index_js_2.ExpertStatus.OFFLINE,
        isApproved: approve,
        isVerified: approve,
    });
    return expert;
}
async function findExpertByMobile(mobile) {
    return Expert_js_1.default.findOne({ mobile: { $in: (0, phone_js_1.phoneLookupVariants)(mobile) } });
}
async function assertExpertCanLogin(mobile) {
    const expert = await findExpertByMobile(mobile);
    if (!expert) {
        throw new AppError_js_1.AuthError("No staff account found for this mobile number. Contact admin to register.");
    }
    if (!expert.isApproved) {
        throw new AppError_js_1.AuthError("Expert account is pending admin approval");
    }
    return expert;
}
async function browseExperts(query, excludeUserId) {
    const filter = { isApproved: true };
    if (query.category)
        filter.categories = query.category;
    if (query.language)
        filter.languages = query.language;
    if (query.minRating)
        filter.rating = { $gte: query.minRating };
    if (query.status)
        filter.status = query.status;
    if (query.gender) {
        const genderUsers = await User_js_1.default.find({ gender: query.gender }).select("_id");
        let ids = genderUsers.map((u) => u._id);
        if (excludeUserId) {
            ids = ids.filter((id) => id.toString() !== excludeUserId);
        }
        filter.userId = { $in: ids };
    }
    else if (excludeUserId) {
        filter.userId = { $ne: excludeUserId };
    }
    if (query.search) {
        const term = query.search.trim();
        if (term) {
            const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            const matchingUsers = await User_js_1.default.find({ name: { $regex: escaped, $options: "i" } }).select("_id");
            const userIds = matchingUsers
                .map((u) => u._id)
                .filter((id) => !excludeUserId || id.toString() !== excludeUserId);
            const or = [
                { bio: { $regex: escaped, $options: "i" } },
                { languages: { $regex: escaped, $options: "i" } },
            ];
            if (userIds.length > 0)
                or.push({ userId: { $in: userIds } });
            filter.$or = or;
        }
    }
    let sort = { rating: -1 };
    if (query.sort === "price")
        sort = { pricePerMinute: query.order === "asc" ? 1 : -1 };
    if (query.sort === "experience")
        sort = { experience: -1 };
    const result = await (0, pagination_js_1.paginate)({
        model: Expert_js_1.default,
        filter,
        query,
        populate: [
            { path: "userId", select: "name avatar gender city state country" },
            { path: "categories", select: "name slug icon" },
        ],
        sort,
    });
    // Online (staff-panel status) first, then busy, then offline — within the page.
    const rank = (status) => status === index_js_2.ExpertStatus.ONLINE ? 0 : status === index_js_2.ExpertStatus.BUSY ? 1 : 2;
    result.data = [...result.data].sort((a, b) => rank(a.status) - rank(b.status));
    // Extra safety: drop self if still present after populate
    if (excludeUserId) {
        result.data = result.data.filter((expert) => {
            const uid = expert.userId;
            const id = uid && typeof uid === "object" && "_id" in uid
                ? String(uid._id)
                : String(uid);
            return id !== excludeUserId;
        });
    }
    return result;
}
async function getExpertProfile(expertId) {
    const expert = await Expert_js_1.default.findOne({ _id: expertId, isApproved: true })
        .populate("userId", "name avatar gender city state country")
        .populate("categories", "name slug icon");
    if (!expert)
        throw new AppError_js_1.NotFoundError("Expert");
    return expert;
}
async function getExpertReviews(expertId, query = {}) {
    const expert = await Expert_js_1.default.findOne({ _id: expertId, isApproved: true });
    if (!expert)
        throw new AppError_js_1.NotFoundError("Expert");
    const result = await (0, pagination_js_1.paginate)({
        model: Call_js_1.default,
        filter: {
            expertId,
            status: index_js_1.CallStatus.COMPLETED,
            rating: { $exists: true, $ne: null },
        },
        query,
        select: "rating review createdAt userId",
        populate: { path: "userId", select: "name avatar" },
        sort: { createdAt: -1 },
    });
    return {
        ...result,
        data: result.data.map((r) => {
            const row = r;
            const author = row.userId && typeof row.userId === "object" && row.userId.name
                ? row.userId.name
                : "Anonymous User";
            return {
                rating: row.rating || 0,
                review: row.review || "",
                createdAt: row.createdAt,
                authorName: author,
            };
        }),
    };
}
async function updateExpertProfile(userId, data) {
    const expert = await Expert_js_1.default.findOne({ userId });
    if (!expert)
        throw new AppError_js_1.NotFoundError("Expert profile");
    Object.assign(expert, data);
    await expert.save();
    return expert;
}
async function updateExpertStatus(userId, status) {
    const expert = await Expert_js_1.default.findOne({ userId, isApproved: true });
    if (!expert)
        throw new AppError_js_1.ForbiddenError("Approved expert profile required");
    expert.status = status;
    await expert.save();
    return expert;
}
async function getExpertDashboard(userId) {
    const expert = await Expert_js_1.default.findOne({ userId }).populate("userId", "name avatar");
    if (!expert)
        throw new AppError_js_1.NotFoundError("Expert profile");
    const earnings = await (0, payout_service_js_1.getExpertEarningsSummary)(expert._id.toString());
    return { expert, earnings };
}
async function getExpertEarnings(userId, query) {
    const expert = await Expert_js_1.default.findOne({ userId });
    if (!expert)
        throw new AppError_js_1.NotFoundError("Expert profile");
    return (0, payout_service_js_1.getExpertPayouts)(expert._id.toString(), query);
}
async function getPublicCategories() {
    return Category_js_1.default.find({ isActive: true }).sort({ order: 1 }).select("name slug description icon");
}
//# sourceMappingURL=expert.service.js.map