"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.storyUploadQuerySchema = exports.createStorySchema = void 0;
const zod_1 = require("zod");
const constants_js_1 = require("../utils/constants.js");
exports.createStorySchema = zod_1.z
    .object({
    mediaUrl: zod_1.z.string().url(),
    publicId: zod_1.z.string().min(1),
    mediaType: zod_1.z.enum(["image", "video"]),
    thumbnailUrl: zod_1.z.string().url().optional(),
    caption: zod_1.z.string().max(300).optional(),
    durationSec: zod_1.z.number().positive().max(constants_js_1.MAX_FEED_REEL_DURATION_SEC).optional(),
    bytes: zod_1.z.number().positive().optional(),
})
    .superRefine((data, ctx) => {
    if (data.mediaType === "image" && data.bytes && data.bytes > constants_js_1.MAX_FEED_IMAGE_SIZE) {
        ctx.addIssue({ code: zod_1.z.ZodIssueCode.custom, message: "Image exceeds 10MB", path: ["bytes"] });
    }
    if (data.mediaType === "video" && data.bytes && data.bytes > constants_js_1.MAX_FEED_REEL_SIZE) {
        ctx.addIssue({ code: zod_1.z.ZodIssueCode.custom, message: "Video exceeds 100MB", path: ["bytes"] });
    }
});
exports.storyUploadQuerySchema = zod_1.z.object({
    type: zod_1.z.enum(["image", "video"]),
});
//# sourceMappingURL=story.validator.js.map