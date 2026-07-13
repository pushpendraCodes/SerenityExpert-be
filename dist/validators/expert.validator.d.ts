import { z } from "zod";
import { ExpertStatus } from "../types/index.js";
export declare const registerExpertSchema: z.ZodObject<{
    bio: z.ZodOptional<z.ZodString>;
    experience: z.ZodOptional<z.ZodNumber>;
    categories: z.ZodArray<z.ZodString, "many">;
    languages: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    bankDetails: z.ZodOptional<z.ZodObject<{
        accountName: z.ZodString;
        accountNumber: z.ZodString;
        ifscCode: z.ZodString;
        bankName: z.ZodString;
        upiId: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        accountName: string;
        accountNumber: string;
        ifscCode: string;
        bankName: string;
        upiId?: string | undefined;
    }, {
        accountName: string;
        accountNumber: string;
        ifscCode: string;
        bankName: string;
        upiId?: string | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    categories: string[];
    bio?: string | undefined;
    experience?: number | undefined;
    languages?: string[] | undefined;
    bankDetails?: {
        accountName: string;
        accountNumber: string;
        ifscCode: string;
        bankName: string;
        upiId?: string | undefined;
    } | undefined;
}, {
    categories: string[];
    bio?: string | undefined;
    experience?: number | undefined;
    languages?: string[] | undefined;
    bankDetails?: {
        accountName: string;
        accountNumber: string;
        ifscCode: string;
        bankName: string;
        upiId?: string | undefined;
    } | undefined;
}>;
export declare const updateExpertProfileSchema: z.ZodObject<{
    bio: z.ZodOptional<z.ZodString>;
    experience: z.ZodOptional<z.ZodNumber>;
    categories: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    languages: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    bankDetails: z.ZodOptional<z.ZodObject<{
        accountName: z.ZodString;
        accountNumber: z.ZodString;
        ifscCode: z.ZodString;
        bankName: z.ZodString;
        upiId: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        accountName: string;
        accountNumber: string;
        ifscCode: string;
        bankName: string;
        upiId?: string | undefined;
    }, {
        accountName: string;
        accountNumber: string;
        ifscCode: string;
        bankName: string;
        upiId?: string | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    bio?: string | undefined;
    experience?: number | undefined;
    categories?: string[] | undefined;
    languages?: string[] | undefined;
    bankDetails?: {
        accountName: string;
        accountNumber: string;
        ifscCode: string;
        bankName: string;
        upiId?: string | undefined;
    } | undefined;
}, {
    bio?: string | undefined;
    experience?: number | undefined;
    categories?: string[] | undefined;
    languages?: string[] | undefined;
    bankDetails?: {
        accountName: string;
        accountNumber: string;
        ifscCode: string;
        bankName: string;
        upiId?: string | undefined;
    } | undefined;
}>;
export declare const updateStatusSchema: z.ZodObject<{
    status: z.ZodNativeEnum<typeof ExpertStatus>;
}, "strip", z.ZodTypeAny, {
    status: ExpertStatus;
}, {
    status: ExpertStatus;
}>;
export declare const updateAvailabilitySchema: z.ZodObject<{
    availabilitySchedule: z.ZodArray<z.ZodObject<{
        day: z.ZodEnum<["mon", "tue", "wed", "thu", "fri", "sat", "sun"]>;
        startTime: z.ZodString;
        endTime: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        day: "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
        startTime: string;
        endTime: string;
    }, {
        day: "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
        startTime: string;
        endTime: string;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    availabilitySchedule: {
        day: "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
        startTime: string;
        endTime: string;
    }[];
}, {
    availabilitySchedule: {
        day: "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
        startTime: string;
        endTime: string;
    }[];
}>;
export declare const browseExpertsSchema: z.ZodObject<{
    category: z.ZodOptional<z.ZodString>;
    language: z.ZodOptional<z.ZodString>;
    minRating: z.ZodOptional<z.ZodNumber>;
    status: z.ZodOptional<z.ZodNativeEnum<typeof ExpertStatus>>;
    page: z.ZodOptional<z.ZodNumber>;
    limit: z.ZodOptional<z.ZodNumber>;
    sort: z.ZodOptional<z.ZodEnum<["rating", "price", "experience"]>>;
    order: z.ZodOptional<z.ZodEnum<["asc", "desc"]>>;
}, "strip", z.ZodTypeAny, {
    sort?: "experience" | "rating" | "price" | undefined;
    limit?: number | undefined;
    status?: ExpertStatus | undefined;
    page?: number | undefined;
    order?: "asc" | "desc" | undefined;
    category?: string | undefined;
    language?: string | undefined;
    minRating?: number | undefined;
}, {
    sort?: "experience" | "rating" | "price" | undefined;
    limit?: number | undefined;
    status?: ExpertStatus | undefined;
    page?: number | undefined;
    order?: "asc" | "desc" | undefined;
    category?: string | undefined;
    language?: string | undefined;
    minRating?: number | undefined;
}>;
//# sourceMappingURL=expert.validator.d.ts.map