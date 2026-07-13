import { z } from "zod";
import { DiscountType } from "../types/index.js";
export declare const manageUserSchema: z.ZodObject<{
    isBlocked: z.ZodOptional<z.ZodBoolean>;
    role: z.ZodOptional<z.ZodEnum<["user", "expert", "admin"]>>;
}, "strip", z.ZodTypeAny, {
    role?: "user" | "expert" | "admin" | undefined;
    isBlocked?: boolean | undefined;
}, {
    role?: "user" | "expert" | "admin" | undefined;
    isBlocked?: boolean | undefined;
}>;
export declare const walletAdjustmentSchema: z.ZodObject<{
    amount: z.ZodNumber;
    description: z.ZodString;
    type: z.ZodEnum<["credit", "debit"]>;
}, "strip", z.ZodTypeAny, {
    type: "credit" | "debit";
    description: string;
    amount: number;
}, {
    type: "credit" | "debit";
    description: string;
    amount: number;
}>;
export declare const approveExpertSchema: z.ZodObject<{
    isApproved: z.ZodBoolean;
    rejectionReason: z.ZodOptional<z.ZodString>;
    pricePerMinute: z.ZodOptional<z.ZodNumber>;
    commissionPercent: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    isApproved: boolean;
    pricePerMinute?: number | undefined;
    rejectionReason?: string | undefined;
    commissionPercent?: number | undefined;
}, {
    isApproved: boolean;
    pricePerMinute?: number | undefined;
    rejectionReason?: string | undefined;
    commissionPercent?: number | undefined;
}>;
export declare const updateSettingsSchema: z.ZodObject<{
    settings: z.ZodArray<z.ZodObject<{
        key: z.ZodString;
        value: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        value: string;
        key: string;
        description?: string | undefined;
    }, {
        value: string;
        key: string;
        description?: string | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    settings: {
        value: string;
        key: string;
        description?: string | undefined;
    }[];
}, {
    settings: {
        value: string;
        key: string;
        description?: string | undefined;
    }[];
}>;
export declare const createCategorySchema: z.ZodObject<{
    name: z.ZodString;
    slug: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    icon: z.ZodOptional<z.ZodString>;
    order: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    name: string;
    description?: string | undefined;
    icon?: string | undefined;
    order?: number | undefined;
    slug?: string | undefined;
}, {
    name: string;
    description?: string | undefined;
    icon?: string | undefined;
    order?: number | undefined;
    slug?: string | undefined;
}>;
export declare const createFaqSchema: z.ZodObject<{
    question: z.ZodString;
    answer: z.ZodString;
    category: z.ZodOptional<z.ZodString>;
    order: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    question: string;
    answer: string;
    order?: number | undefined;
    category?: string | undefined;
}, {
    question: string;
    answer: string;
    order?: number | undefined;
    category?: string | undefined;
}>;
export declare const createBannerSchema: z.ZodObject<{
    title: z.ZodString;
    imageUrl: z.ZodString;
    link: z.ZodOptional<z.ZodString>;
    position: z.ZodOptional<z.ZodString>;
    startDate: z.ZodOptional<z.ZodString>;
    endDate: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    title: string;
    imageUrl: string;
    link?: string | undefined;
    position?: string | undefined;
    startDate?: string | undefined;
    endDate?: string | undefined;
}, {
    title: string;
    imageUrl: string;
    link?: string | undefined;
    position?: string | undefined;
    startDate?: string | undefined;
    endDate?: string | undefined;
}>;
export declare const createCouponSchema: z.ZodObject<{
    code: z.ZodString;
    discountType: z.ZodNativeEnum<typeof DiscountType>;
    discountValue: z.ZodNumber;
    minAmount: z.ZodOptional<z.ZodNumber>;
    maxDiscount: z.ZodOptional<z.ZodNumber>;
    usageLimit: z.ZodOptional<z.ZodNumber>;
    validFrom: z.ZodOptional<z.ZodString>;
    validTo: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    code: string;
    discountType: DiscountType;
    discountValue: number;
    minAmount?: number | undefined;
    maxDiscount?: number | undefined;
    usageLimit?: number | undefined;
    validFrom?: string | undefined;
    validTo?: string | undefined;
}, {
    code: string;
    discountType: DiscountType;
    discountValue: number;
    minAmount?: number | undefined;
    maxDiscount?: number | undefined;
    usageLimit?: number | undefined;
    validFrom?: string | undefined;
    validTo?: string | undefined;
}>;
export declare const resolveReportSchema: z.ZodObject<{
    status: z.ZodEnum<["reviewed", "resolved"]>;
    action: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status: "reviewed" | "resolved";
    action?: string | undefined;
}, {
    status: "reviewed" | "resolved";
    action?: string | undefined;
}>;
export declare const pushNotificationSchema: z.ZodObject<{
    title: z.ZodString;
    body: z.ZodString;
    userIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    role: z.ZodOptional<z.ZodEnum<["user", "expert", "all"]>>;
}, "strip", z.ZodTypeAny, {
    body: string;
    title: string;
    role?: "user" | "expert" | "all" | undefined;
    userIds?: string[] | undefined;
}, {
    body: string;
    title: string;
    role?: "user" | "expert" | "all" | undefined;
    userIds?: string[] | undefined;
}>;
export declare const analyticsQuerySchema: z.ZodObject<{
    period: z.ZodOptional<z.ZodEnum<["week", "month", "year"]>>;
}, "strip", z.ZodTypeAny, {
    period?: "year" | "week" | "month" | undefined;
}, {
    period?: "year" | "week" | "month" | undefined;
}>;
//# sourceMappingURL=admin.validator.d.ts.map