import { z } from "zod";
import { ExpertStatus, Gender } from "../types/index.js";

export const registerExpertSchema = z.object({
  bio: z.string().max(1000).optional(),
  experience: z.number().min(0).optional(),
  categories: z.array(z.string()).optional(),
  languages: z.array(z.string()).min(1).optional(),
  bankDetails: z.object({
    accountName: z.string().min(1),
    accountNumber: z.string().min(1),
    ifscCode: z.string().min(1),
    bankName: z.string().min(1),
    upiId: z.string().optional(),
  }).optional(),
});

export const updateExpertProfileSchema = z.object({
  bio: z.string().max(1000).optional(),
  experience: z.number().min(0).optional(),
  categories: z.array(z.string()).optional(),
  languages: z.array(z.string()).optional(),
  bankDetails: z.object({
    accountName: z.string().min(1),
    accountNumber: z.string().min(1),
    ifscCode: z.string().min(1),
    bankName: z.string().min(1),
    upiId: z.string().optional(),
  }).optional(),
});

export const updateStatusSchema = z.object({
  status: z.nativeEnum(ExpertStatus),
});

export const browseExpertsSchema = z.object({
  category: z.string().optional(),
  search: z.string().optional(),
  language: z.string().optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  status: z.nativeEnum(ExpertStatus).optional(),
  gender: z.nativeEnum(Gender).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  sort: z.enum(["rating", "price", "experience"]).optional(),
  order: z.enum(["asc", "desc"]).optional(),
});
