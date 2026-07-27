import { z } from "zod";
import { JournalVisibility, JournalMediaType } from "../types/index.js";
import {
  MAX_FEED_IMAGES_PER_POST,
  MAX_FEED_IMAGE_SIZE,
  MAX_FEED_REEL_SIZE,
  MAX_FEED_REEL_DURATION_SEC,
} from "../utils/constants.js";

const mediaItemSchema = z.object({
  url: z.string().url(),
  publicId: z.string().min(1),
  resourceType: z.enum(["image", "video"]),
  thumbnailUrl: z.string().url().optional(),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  durationSec: z.number().positive().max(MAX_FEED_REEL_DURATION_SEC).optional(),
  bytes: z.number().positive().optional(),
});

export const createPostSchema = z
  .object({
    body: z.string().max(5000).optional().default(""),
    visibility: z.nativeEnum(JournalVisibility),
    mediaType: z.nativeEnum(JournalMediaType).optional().default(JournalMediaType.NONE),
    media: z.array(mediaItemSchema).optional().default([]),
  })
  .superRefine((data, ctx) => {
    const body = (data.body || "").trim();
    const media = data.media || [];
    const mediaType = data.mediaType || JournalMediaType.NONE;

    if (!body && media.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Post needs text or media",
        path: ["body"],
      });
    }

    if (mediaType === JournalMediaType.NONE && media.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "mediaType required when media is present",
        path: ["mediaType"],
      });
    }

    if (mediaType === JournalMediaType.IMAGE) {
      if (media.length < 1 || media.length > MAX_FEED_IMAGES_PER_POST) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Image posts need 1–${MAX_FEED_IMAGES_PER_POST} images`,
          path: ["media"],
        });
      }
      for (const [i, m] of media.entries()) {
        if (m.resourceType !== "image") {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Image posts can only include images",
            path: ["media", i],
          });
        }
        if (m.bytes && m.bytes > MAX_FEED_IMAGE_SIZE) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Image exceeds 10MB",
            path: ["media", i, "bytes"],
          });
        }
      }
    }

    if (mediaType === JournalMediaType.REEL) {
      if (media.length !== 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Reel posts need exactly one video",
          path: ["media"],
        });
      } else {
        const m = media[0];
        if (m.resourceType !== "video") {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Reel must be a video",
            path: ["media", 0],
          });
        }
        if (m.bytes && m.bytes > MAX_FEED_REEL_SIZE) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Reel exceeds 100MB",
            path: ["media", 0, "bytes"],
          });
        }
      }
    }

    if (mediaType === JournalMediaType.NONE && media.length > 0) {
      // already handled
    }
  });

export const updatePostSchema = z.object({
  body: z.string().min(1).max(5000).optional(),
  visibility: z.nativeEnum(JournalVisibility).optional(),
});

export const commentSchema = z.object({
  body: z.string().min(1).max(2000),
  parentCommentId: z.string().optional(),
});

export const feedQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    discover: z
      .union([z.literal("true"), z.literal("false"), z.boolean()])
      .optional()
      .transform((v) => v === true || v === "true"),
  })
  .passthrough();

export const uploadSignatureQuerySchema = z.object({
  type: z.enum(["image", "video"]),
});
