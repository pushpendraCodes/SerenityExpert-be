"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const mongoose_1 = __importDefault(require("mongoose"));
const db_js_1 = __importDefault(require("../config/db.js"));
const User_js_1 = __importDefault(require("../models/User.js"));
const Expert_js_1 = __importDefault(require("../models/Expert.js"));
const Category_js_1 = __importDefault(require("../models/Category.js"));
const admin_service_js_1 = require("../services/admin.service.js");
const index_js_1 = require("../types/index.js");
const constants_js_1 = require("../utils/constants.js");
/** All seed account phone numbers — used for cleanup with --fresh */
const SEED_PHONES = [
    "9000000001", // admin
    "9100000001",
    "9100000002",
    "9100000003", // users
    "9200000001",
    "9200000002",
    "9200000003",
    "9200000004", // experts
];
const CATEGORIES = [
    { name: "Mental Health", slug: "mental-health", description: "Anxiety, stress, depression support", icon: "🧠", order: 1 },
    { name: "Relationships", slug: "relationships", description: "Marriage, dating, family advice", icon: "💑", order: 2 },
    { name: "Career", slug: "career", description: "Job, business, and career guidance", icon: "💼", order: 3 },
    { name: "Finance", slug: "finance", description: "Personal finance and investment tips", icon: "💰", order: 4 },
];
const EXPERTS = [
    {
        mobile: "9200000001",
        name: "Dr. Ananya Sharma",
        bio: "Clinical psychologist with 8 years of experience in anxiety and stress management.",
        experience: 8,
        languages: ["English", "Hindi"],
        pricePerMinute: 15,
        rating: 4.8,
        totalRatings: 124,
        status: index_js_1.ExpertStatus.ONLINE,
        isApproved: true,
    },
    {
        mobile: "9200000002",
        name: "Rajesh Kumar",
        bio: "Certified career coach helping professionals navigate job transitions.",
        experience: 12,
        languages: ["English", "Hindi", "Tamil"],
        pricePerMinute: 12,
        rating: 4.5,
        totalRatings: 89,
        status: index_js_1.ExpertStatus.ONLINE,
        isApproved: true,
    },
    {
        mobile: "9200000003",
        name: "Priya Mehta",
        bio: "Relationship counselor specializing in marriage and family therapy.",
        experience: 6,
        languages: ["English", "Gujarati"],
        pricePerMinute: 10,
        rating: 4.9,
        totalRatings: 201,
        status: index_js_1.ExpertStatus.OFFLINE,
        isApproved: true,
    },
    {
        mobile: "9200000004",
        name: "Vikram Singh",
        bio: "Finance advisor — pending admin approval (cannot login yet).",
        experience: 10,
        languages: ["English", "Hindi"],
        pricePerMinute: 20,
        rating: 0,
        totalRatings: 0,
        status: index_js_1.ExpertStatus.OFFLINE,
        isApproved: false,
    },
];
const USERS = [
    { phone: "9100000001", name: "Rahul Verma", walletBalance: 500, email: "rahul@test.com" },
    { phone: "9100000002", name: "Sneha Patel", walletBalance: 250, email: "sneha@test.com" },
    { phone: "9100000003", name: "Amit Joshi", walletBalance: 1000, email: "amit@test.com" },
];
async function clearSeedData() {
    const experts = await Expert_js_1.default.find({ mobile: { $in: SEED_PHONES } }).select("userId");
    const expertUserIds = experts.map((e) => e.userId);
    await Expert_js_1.default.deleteMany({ mobile: { $in: SEED_PHONES } });
    await User_js_1.default.deleteMany({
        $or: [
            { phone: { $in: SEED_PHONES } },
            { _id: { $in: expertUserIds } },
        ],
    });
    console.log("🗑️  Cleared existing seed users & experts");
}
async function seedCategories() {
    const categories = [];
    for (const cat of CATEGORIES) {
        const doc = await Category_js_1.default.findOneAndUpdate({ slug: cat.slug }, { ...cat, isActive: true }, { upsert: true, new: true });
        categories.push(doc);
    }
    console.log(`✅ ${categories.length} categories seeded`);
    return categories;
}
async function seedAdmin() {
    const admin = await User_js_1.default.findOneAndUpdate({ phone: "9000000001" }, {
        phone: "9000000001",
        name: "Super Admin",
        email: "admin@expertconsultant.com",
        avatar: (0, constants_js_1.generateDummyAvatar)("admin"),
        role: index_js_1.UserRole.ADMIN,
        isVerified: true,
        isBlocked: false,
        walletBalance: 0,
    }, { upsert: true, new: true });
    console.log("✅ Admin seeded");
    return admin;
}
async function seedUsers() {
    const users = [];
    for (const u of USERS) {
        const doc = await User_js_1.default.findOneAndUpdate({ phone: u.phone }, {
            phone: u.phone,
            name: u.name,
            email: u.email,
            avatar: (0, constants_js_1.generateDummyAvatar)(u.phone),
            role: index_js_1.UserRole.USER,
            isVerified: true,
            isBlocked: false,
            walletBalance: u.walletBalance,
        }, { upsert: true, new: true });
        users.push(doc);
    }
    console.log(`✅ ${users.length} users seeded`);
    return users;
}
async function seedExperts(categoryIds) {
    const mentalHealth = categoryIds[0];
    const relationships = categoryIds[1];
    const career = categoryIds[2];
    const finance = categoryIds[3];
    const categoryMap = {
        "9200000001": [mentalHealth],
        "9200000002": [career],
        "9200000003": [relationships],
        "9200000004": [finance],
    };
    for (const exp of EXPERTS) {
        let user = await User_js_1.default.findOne({ phone: exp.mobile });
        if (!user) {
            user = await User_js_1.default.create({
                phone: exp.mobile,
                name: exp.name,
                avatar: (0, constants_js_1.generateDummyAvatar)(exp.mobile),
                role: exp.isApproved ? index_js_1.UserRole.EXPERT : index_js_1.UserRole.USER,
                isVerified: exp.isApproved,
                isBlocked: false,
                walletBalance: 0,
            });
        }
        else {
            user.name = exp.name;
            user.role = exp.isApproved ? index_js_1.UserRole.EXPERT : index_js_1.UserRole.USER;
            user.isVerified = exp.isApproved;
            await user.save();
        }
        await Expert_js_1.default.findOneAndUpdate({ mobile: exp.mobile }, {
            userId: user._id,
            mobile: exp.mobile,
            bio: exp.bio,
            experience: exp.experience,
            categories: categoryMap[exp.mobile] || [mentalHealth],
            languages: exp.languages,
            pricePerMinute: exp.pricePerMinute,
            commissionPercent: 20,
            rating: exp.rating,
            totalRatings: exp.totalRatings,
            totalCalls: exp.isApproved ? Math.floor(exp.totalRatings * 0.6) : 0,
            totalMinutes: exp.isApproved ? exp.totalRatings * 15 : 0,
            totalEarnings: exp.isApproved ? exp.totalRatings * exp.pricePerMinute * 5 : 0,
            status: exp.status,
            isApproved: exp.isApproved,
            isVerified: exp.isApproved,
            bankDetails: exp.isApproved
                ? {
                    accountName: exp.name,
                    accountNumber: "1234567890",
                    ifscCode: "HDFC0001234",
                    bankName: "HDFC Bank",
                    upiId: `${exp.mobile}@upi`,
                }
                : undefined,
        }, { upsert: true, new: true });
    }
    console.log(`✅ ${EXPERTS.length} experts seeded (${EXPERTS.filter((e) => e.isApproved).length} approved, 1 pending)`);
}
function printSummary() {
    console.log("\n" + "═".repeat(60));
    console.log("  SEED COMPLETE — Test Accounts");
    console.log("═".repeat(60));
    console.log("\n📱 OTP is logged to the server console in development.\n");
    console.log("┌─────────────┬──────────────────────┬─────────────────────────────┐");
    console.log("│ Role        │ Phone                │ Login endpoint              │");
    console.log("├─────────────┼──────────────────────┼─────────────────────────────┤");
    console.log("│ Admin       │ 9000000001           │ POST /api/auth/send-otp     │");
    console.log("│             │                      │ POST /api/auth/verify-otp   │");
    console.log("├─────────────┼──────────────────────┼─────────────────────────────┤");
    console.log("│ User        │ 9100000001 (₹500)    │ POST /api/auth/send-otp     │");
    console.log("│ User        │ 9100000002 (₹250)    │ POST /api/auth/verify-otp   │");
    console.log("│ User        │ 9100000003 (₹1000)   │                             │");
    console.log("├─────────────┼──────────────────────┼─────────────────────────────┤");
    console.log("│ Expert ✓    │ 9200000001 (online)  │ POST /api/auth/expert/send-otp   │");
    console.log("│ Expert ✓    │ 9200000002 (online)  │ POST /api/auth/expert/verify-otp│");
    console.log("│ Expert ✓    │ 9200000003 (offline) │                             │");
    console.log("│ Expert ✗    │ 9200000004 (pending) │ Cannot login until approved │");
    console.log("└─────────────┴──────────────────────┴─────────────────────────────┘");
    console.log("\nExample — user login:");
    console.log('  curl -X POST http://localhost:5000/api/auth/send-otp -H "Content-Type: application/json" -d "{\\"phone\\":\\"9100000001\\"}"');
    console.log("\nExample — expert login:");
    console.log('  curl -X POST http://localhost:5000/api/auth/expert/send-otp -H "Content-Type: application/json" -d "{\\"phone\\":\\"9200000001\\"}"');
    console.log("\nRe-run with --fresh to wipe and re-seed:  pnpm seed:fresh\n");
}
async function main() {
    const isFresh = process.argv.includes("--fresh");
    try {
        await (0, db_js_1.default)();
        if (isFresh) {
            await clearSeedData();
        }
        await (0, admin_service_js_1.seedDefaultSettings)();
        const categories = await seedCategories();
        await seedAdmin();
        await seedUsers();
        await seedExperts(categories.map((c) => c._id));
        printSummary();
    }
    catch (err) {
        console.error("❌ Seed failed:", err.message);
        process.exit(1);
    }
    finally {
        await mongoose_1.default.disconnect();
        console.log("🔌 Disconnected from MongoDB");
        process.exit(0);
    }
}
main();
//# sourceMappingURL=seed.js.map