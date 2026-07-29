"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.myPostsQuerySchema = exports.uploadSignatureQuerySchema = exports.feedQuerySchema = exports.commentSchema = exports.updatePostSchema = exports.createPostSchema = void 0;
const zod_1 = require("zod");
const index_js_1 = require("../types/index.js");
const constants_js_1 = require("../utils/constants.js");
const mediaItemSchema = zod_1.z.object({
    url: zod_1.z.string().url(),
    publicId: zod_1.z.string().min(1),
    resourceType: zod_1.z.enum(["image", "video"]),
    thumbnailUrl: zod_1.z.string().url().optional(),
    width: zod_1.z.number().positive().optional(),
    height: zod_1.z.number().positive().optional(),
    durationSec: zod_1.z.number().positive().max(constants_js_1.MAX_FEED_REEL_DURATION_SEC).optional(),
    bytes: zod_1.z.number().positive().optional(),
});
exports.createPostSchema = zod_1.z
    .object({
    body: zod_1.z.string().max(5000).optional().default(""),
    visibility: zod_1.z.nativeEnum(index_js_1.JournalVisibility),
    mediaType: zod_1.z.nativeEnum(index_js_1.JournalMediaType).optional().default(index_js_1.JournalMediaType.NONE),
    media: zod_1.z.array(mediaItemSchema).optional().default([]),
})
    .superRefine((data, ctx) => {
    const body = (data.body || "").trim();
    const media = data.media || [];
    const mediaType = data.mediaType || index_js_1.JournalMediaType.NONE;
    if (!body && media.length === 0) {
        ctx.addIssue({
            code: zod_1.z.ZodIssueCode.custom,
            message: "Post needs text or media",
            path: ["body"],
        });
    }
    if (mediaType === index_js_1.JournalMediaType.NONE && media.length > 0) {
        ctx.addIssue({
            code: zod_1.z.ZodIssueCode.custom,
            message: "mediaType required when media is present",
            path: ["mediaType"],
        });
    }
    if (mediaType === index_js_1.JournalMediaType.IMAGE) {
        if (media.length < 1 || media.length > constants_js_1.MAX_FEED_IMAGES_PER_POST) {
            ctx.addIssue({
                code: zod_1.z.ZodIssueCode.custom,
                message: `Image posts need 1–${constants_js_1.MAX_FEED_IMAGES_PER_POST} images`,
                path: ["media"],
            });
        }
        for (const [i, m] of media.entries()) {
            if (m.resourceType !== "image") {
                ctx.addIssue({
                    code: zod_1.z.ZodIssueCode.custom,
                    message: "Image posts can only include images",
                    path: ["media", i],
                });
            }
            if (m.bytes && m.bytes > constants_js_1.MAX_FEED_IMAGE_SIZE) {
                ctx.addIssue({
                    code: zod_1.z.ZodIssueCode.custom,
                    message: "Image exceeds 10MB",
                    path: ["media", i, "bytes"],
                });
            }
        }
    }
    if (mediaType === index_js_1.JournalMediaType.REEL) {
        if (media.length !== 1) {
            ctx.addIssue({
                code: zod_1.z.ZodIssueCode.custom,
                message: "Reel posts need exactly one video",
                path: ["media"],
            });
        }
        else {
            const m = media[0];
            if (m.resourceType !== "video") {
                ctx.addIssue({
                    code: zod_1.z.ZodIssueCode.custom,
                    message: "Reel must be a video",
                    path: ["media", 0],
                });
            }
            if (m.bytes && m.bytes > constants_js_1.MAX_FEED_REEL_SIZE) {
                ctx.addIssue({
                    code: zod_1.z.ZodIssueCode.custom,
                    message: "Reel exceeds 100MB",
                    path: ["media", 0, "bytes"],
                });
            }
        }
    }
    if (mediaType === index_js_1.JournalMediaType.NONE && media.length > 0) {
        // already handled
    }
});
exports.updatePostSchema = zod_1.z.object({
    body: zod_1.z.string().min(1).max(5000).optional(),
    visibility: zod_1.z.nativeEnum(index_js_1.JournalVisibility).optional(),
});
exports.commentSchema = zod_1.z.object({
    body: zod_1.z.string().min(1).max(2000),
    parentCommentId: zod_1.z.string().optional(),
});
exports.feedQuerySchema = zod_1.z
    .object({
    page: zod_1.z.coerce.number().int().min(1).optional(),
    limit: zod_1.z.coerce.number().int().min(1).max(100).optional(),
    discover: zod_1.z
        .union([zod_1.z.literal("true"), zod_1.z.literal("false"), zod_1.z.boolean()])
        .optional()
        .transform((v) => v === true || v === "true"),
})
    .passthrough();
exports.uploadSignatureQuerySchema = zod_1.z.object({
    type: zod_1.z.enum(["image", "video"]),
});
exports.myPostsQuerySchema = zod_1.z
    .object({
    page: zod_1.z.coerce.number().int().min(1).optional(),
    limit: zod_1.z.coerce.number().int().min(1).max(100).optional(),
    sort: zod_1.z.string().optional(),
    order: zod_1.z.enum(["asc", "desc"]).optional(),
    visibility: zod_1.z.enum(["public", "private"]).optional(),
})
    .passthrough();
//# sourceMappingURL=journal.validator.js.map