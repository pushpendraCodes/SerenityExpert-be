import Payout from "../models/Payout.js";
import type { PaginationQuery } from "../types/index.js";
export declare function calculateExpertEarnings(expertId: string, periodStart: Date, periodEnd: Date): Promise<{
    grossAmount: number;
    commission: number;
    netAmount: number;
    callCount: number;
}>;
export declare function createPayoutRequest(expertId: string): Promise<typeof Payout.prototype>;
export declare function processWeeklyPayouts(): Promise<number>;
export declare function getExpertPayouts(expertId: string, query: PaginationQuery): Promise<import("../types/index.js").PaginatedResult<import("../models/Payout.js").IPayout>>;
export declare function getAllPayouts(query: PaginationQuery): Promise<import("../types/index.js").PaginatedResult<import("../models/Payout.js").IPayout>>;
export declare function getExpertEarningsSummary(expertId: string): Promise<{
    totalEarnings: number;
    totalCalls: number;
    totalMinutes: number;
    commissionPercent: number;
    weeklyEarnings: {
        grossAmount: number;
        commission: number;
        netAmount: number;
        callCount: number;
    };
    recentPayouts: (import("mongoose").Document<unknown, {}, import("../models/Payout.js").IPayout, {}, import("mongoose").DefaultSchemaOptions> & import("../models/Payout.js").IPayout & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    })[];
    recentCalls: (import("mongoose").Document<unknown, {}, import("../models/Call.js").ICall, {}, import("mongoose").DefaultSchemaOptions> & import("../models/Call.js").ICall & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    })[];
} | null>;
//# sourceMappingURL=payout.service.d.ts.map