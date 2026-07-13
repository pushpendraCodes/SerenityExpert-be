import { z } from "zod";

export const initiateCallSchema = z.object({
  expertId: z.string().min(1, "Expert ID is required"),
});

export const rateCallSchema = z.object({
  rating: z.number().int().min(1).max(5),
  review: z.string().max(500).optional(),
});

export const callHistorySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  status: z.string().optional(),
});
