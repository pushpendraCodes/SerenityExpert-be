"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.callHistorySchema = exports.rateCallSchema = exports.initiateCallSchema = void 0;
const zod_1 = require("zod");
exports.initiateCallSchema = zod_1.z.object({
    expertId: zod_1.z.string().min(1, "Expert ID is required"),
});
exports.rateCallSchema = zod_1.z.object({
    rating: zod_1.z.number().int().min(1).max(5),
    review: zod_1.z.string().max(500).optional(),
});
exports.callHistorySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1).optional(),
    limit: zod_1.z.coerce.number().int().min(1).max(100).optional(),
    status: zod_1.z.string().optional(),
});
//# sourceMappingURL=call.validator.js.map