import { z } from "zod";
import { MAX_FEED_REEL_DURATION_SEC, MAX_FEED_REEL_SIZE, MAX_FEED_IMAGE_SIZE } from "../utils/constants.js";

export const createStorySchema = z
  .object({
    mediaUrl: z.string().url(),
    publicId: z.string().min(1),
    mediaType: z.enum(["image", "video"]),
    thumbnailUrl: z.string().url().optional(),
    caption: z.string().max(300).optional(),
    durationSec: z.number().positive().max(MAX_FEED_REEL_DURATION_SEC).optional(),
    bytes: z.number().positive().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.mediaType === "image" && data.bytes && data.bytes > MAX_FEED_IMAGE_SIZE) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Image exceeds 10MB", path: ["bytes"] });
    }
    if (data.mediaType === "video" && data.bytes && data.bytes > MAX_FEED_REEL_SIZE) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Video exceeds 100MB", path: ["bytes"] });
    }
  });

export const storyUploadQuerySchema = z.object({
  type: z.enum(["image", "video"]),
});
