import { ExpertStatus } from "../types/index.js";
import type { PaginationQuery } from "../types/index.js";
import type { IExpert } from "../models/Expert.js";
import type { AvailabilitySlot } from "../types/index.js";
export declare function registerExpert(userId: string, data: {
    bio?: string;
    experience?: number;
    categories: string[];
    languages?: string[];
    bankDetails?: IExpert["bankDetails"];
}): Promise<IExpert>;
export declare function browseExperts(query: PaginationQuery & {
    category?: string;
    language?: string;
    minRating?: number;
    status?: ExpertStatus;
    sort?: string;
}): Promise<import("../types/index.js").PaginatedResult<IExpert>>;
export declare function getExpertProfile(expertId: string): Promise<import("mongoose").Document<unknown, {}, IExpert, {}, import("mongoose").DefaultSchemaOptions> & IExpert & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}>;
export declare function updateExpertProfile(userId: string, data: Partial<{
    bio: string;
    experience: number;
    categories: string[];
    languages: string[];
    bankDetails: IExpert["bankDetails"];
}>): Promise<IExpert>;
export declare function updateExpertStatus(userId: string, status: ExpertStatus): Promise<IExpert>;
export declare function updateAvailability(userId: string, schedule: AvailabilitySlot[]): Promise<IExpert>;
export declare function getExpertDashboard(userId: string): Promise<{
    expert: import("mongoose").Document<unknown, {}, IExpert, {}, import("mongoose").DefaultSchemaOptions> & IExpert & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    };
    earnings: {
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
    } | null;
}>;
export declare function getExpertEarnings(userId: string, query: PaginationQuery): Promise<import("../types/index.js").PaginatedResult<import("../models/Payout.js").IPayout>>;
export declare function requestWithdrawal(userId: string): Promise<any>;
export declare function getPublicCategories(): Promise<(import("mongoose").Document<unknown, {}, import("../models/Category.js").ICategory, {}, import("mongoose").DefaultSchemaOptions> & import("../models/Category.js").ICategory & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
})[]>;
//# sourceMappingURL=expert.service.d.ts.map