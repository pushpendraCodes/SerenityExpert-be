import { z } from "zod";
export declare const updateProfileSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    email?: string | undefined;
}, {
    name?: string | undefined;
    email?: string | undefined;
}>;
export declare const rechargeWalletSchema: z.ZodObject<{
    amount: z.ZodNumber;
    couponCode: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    amount: number;
    couponCode?: string | undefined;
}, {
    amount: number;
    couponCode?: string | undefined;
}>;
export declare const verifyPaymentSchema: z.ZodObject<{
    razorpayOrderId: z.ZodString;
    razorpayPaymentId: z.ZodString;
    razorpaySignature: z.ZodString;
}, "strip", z.ZodTypeAny, {
    razorpayPaymentId: string;
    razorpayOrderId: string;
    razorpaySignature: string;
}, {
    razorpayPaymentId: string;
    razorpayOrderId: string;
    razorpaySignature: string;
}>;
export declare const fcmTokenSchema: z.ZodObject<{
    token: z.ZodString;
}, "strip", z.ZodTypeAny, {
    token: string;
}, {
    token: string;
}>;
export declare const paginationSchema: z.ZodObject<{
    page: z.ZodOptional<z.ZodNumber>;
    limit: z.ZodOptional<z.ZodNumber>;
    sort: z.ZodOptional<z.ZodString>;
    order: z.ZodOptional<z.ZodEnum<["asc", "desc"]>>;
}, "strip", z.ZodTypeAny, {
    sort?: string | undefined;
    limit?: number | undefined;
    page?: number | undefined;
    order?: "asc" | "desc" | undefined;
}, {
    sort?: string | undefined;
    limit?: number | undefined;
    page?: number | undefined;
    order?: "asc" | "desc" | undefined;
}>;
//# sourceMappingURL=user.validator.d.ts.map