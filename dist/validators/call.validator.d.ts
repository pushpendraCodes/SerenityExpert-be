import { z } from "zod";
export declare const initiateCallSchema: z.ZodObject<{
    expertId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    expertId: string;
}, {
    expertId: string;
}>;
export declare const rateCallSchema: z.ZodObject<{
    rating: z.ZodNumber;
    review: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    rating: number;
    review?: string | undefined;
}, {
    rating: number;
    review?: string | undefined;
}>;
export declare const callHistorySchema: z.ZodObject<{
    page: z.ZodOptional<z.ZodNumber>;
    limit: z.ZodOptional<z.ZodNumber>;
    status: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    limit?: number | undefined;
    status?: string | undefined;
    page?: number | undefined;
}, {
    limit?: number | undefined;
    status?: string | undefined;
    page?: number | undefined;
}>;
//# sourceMappingURL=call.validator.d.ts.map