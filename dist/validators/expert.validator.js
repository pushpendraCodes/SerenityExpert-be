"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.browseExpertsSchema = exports.updateAvailabilitySchema = exports.updateStatusSchema = exports.updateExpertProfileSchema = exports.registerExpertSchema = void 0;
const zod_1 = require("zod");
const index_js_1 = require("../types/index.js");
const availabilitySlotSchema = zod_1.z.object({
    day: zod_1.z.enum(["mon", "tue", "wed", "thu", "fri", "sat", "sun"]),
    startTime: zod_1.z.string().regex(/^\d{2}:\d{2}$/),
    endTime: zod_1.z.string().regex(/^\d{2}:\d{2}$/),
});
exports.registerExpertSchema = zod_1.z.object({
    bio: zod_1.z.string().max(1000).optional(),
    experience: zod_1.z.number().min(0).optional(),
    categories: zod_1.z.array(zod_1.z.string()).min(1, "At least one category required"),
    languages: zod_1.z.array(zod_1.z.string()).min(1).optional(),
    bankDetails: zod_1.z.object({
        accountName: zod_1.z.string().min(1),
        accountNumber: zod_1.z.string().min(1),
        ifscCode: zod_1.z.string().min(1),
        bankName: zod_1.z.string().min(1),
        upiId: zod_1.z.string().optional(),
    }).optional(),
});
exports.updateExpertProfileSchema = zod_1.z.object({
    bio: zod_1.z.string().max(1000).optional(),
    experience: zod_1.z.number().min(0).optional(),
    categories: zod_1.z.array(zod_1.z.string()).optional(),
    languages: zod_1.z.array(zod_1.z.string()).optional(),
    bankDetails: zod_1.z.object({
        accountName: zod_1.z.string().min(1),
        accountNumber: zod_1.z.string().min(1),
        ifscCode: zod_1.z.string().min(1),
        bankName: zod_1.z.string().min(1),
        upiId: zod_1.z.string().optional(),
    }).optional(),
});
exports.updateStatusSchema = zod_1.z.object({
    status: zod_1.z.nativeEnum(index_js_1.ExpertStatus),
});
exports.updateAvailabilitySchema = zod_1.z.object({
    availabilitySchedule: zod_1.z.array(availabilitySlotSchema),
});
exports.browseExpertsSchema = zod_1.z.object({
    category: zod_1.z.string().optional(),
    search: zod_1.z.string().optional(),
    language: zod_1.z.string().optional(),
    minRating: zod_1.z.coerce.number().min(0).max(5).optional(),
    status: zod_1.z.nativeEnum(index_js_1.ExpertStatus).optional(),
    page: zod_1.z.coerce.number().int().min(1).optional(),
    limit: zod_1.z.coerce.number().int().min(1).max(100).optional(),
    sort: zod_1.z.enum(["rating", "price", "experience"]).optional(),
    order: zod_1.z.enum(["asc", "desc"]).optional(),
});
//# sourceMappingURL=expert.validator.js.map