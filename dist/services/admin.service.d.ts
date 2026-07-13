import { UserRole, ReportStatus } from "../types/index.js";
import type { PaginationQuery } from "../types/index.js";
export declare function getDashboardMetrics(): Promise<{
    totalUsers: number;
    totalExperts: number;
    onlineExperts: number;
    activeCalls: number;
    totalRevenue: any;
    pendingReports: number;
    pendingExpertApprovals: number;
}>;
export declare function getAnalytics(period?: "week" | "month" | "year"): Promise<{
    userSignups: any[];
    recharges: any[];
    calls: any[];
    revenue: any[];
    period: "year" | "week" | "month";
}>;
export declare function listUsers(query: PaginationQuery & {
    search?: string;
    role?: string;
}): Promise<import("../types/index.js").PaginatedResult<import("../models/User.js").IUser>>;
export declare function updateUser(userId: string, data: {
    isBlocked?: boolean;
    role?: UserRole;
}): Promise<import("mongoose").Document<unknown, {}, import("../models/User.js").IUser, {}, import("mongoose").DefaultSchemaOptions> & import("../models/User.js").IUser & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}>;
export declare function listExperts(query: PaginationQuery & {
    approved?: string;
    search?: string;
}): Promise<import("../types/index.js").PaginatedResult<import("../models/Expert.js").IExpert>>;
export declare function approveExpert(expertId: string, data: {
    isApproved: boolean;
    rejectionReason?: string;
    pricePerMinute?: number;
    commissionPercent?: number;
}): Promise<import("mongoose").Document<unknown, {}, import("../models/Expert.js").IExpert, {}, import("mongoose").DefaultSchemaOptions> & import("../models/Expert.js").IExpert & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}>;
export declare function getTransactions(query: PaginationQuery & {
    type?: string;
    userId?: string;
}): Promise<import("../types/index.js").PaginatedResult<import("../models/Transaction.js").ITransaction>>;
export declare function getReports(query: PaginationQuery & {
    status?: string;
}): Promise<import("../types/index.js").PaginatedResult<import("../models/Report.js").IReport>>;
export declare function resolveReport(reportId: string, adminId: string, data: {
    status: ReportStatus;
    action?: string;
}): Promise<import("mongoose").Document<unknown, {}, import("../models/Report.js").IReport, {}, import("mongoose").DefaultSchemaOptions> & import("../models/Report.js").IReport & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}>;
export declare function getSettings(): Promise<Record<string, string>>;
export declare function updateSettings(settings: Array<{
    key: string;
    value: string;
    description?: string;
}>, adminId: string): Promise<void>;
export declare function getSettingValue(key: string, defaultValue: string): Promise<string>;
export declare function getDefaultPricePerMinute(): Promise<number>;
export declare function getDefaultCommission(): Promise<number>;
export declare const cmsService: {
    listCategories: () => import("mongoose").Query<(import("mongoose").Document<unknown, {}, import("../models/Category.js").ICategory, {}, import("mongoose").DefaultSchemaOptions> & import("../models/Category.js").ICategory & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    })[], import("mongoose").Document<unknown, {}, import("../models/Category.js").ICategory, {}, import("mongoose").DefaultSchemaOptions> & import("../models/Category.js").ICategory & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }, {}, import("../models/Category.js").ICategory, "find", {}>;
    createCategory: (data: Record<string, unknown>) => Promise<import("mongoose").Document<unknown, {}, import("../models/Category.js").ICategory, {}, import("mongoose").DefaultSchemaOptions> & import("../models/Category.js").ICategory & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    updateCategory: (id: string, data: Record<string, unknown>) => import("mongoose").Query<(import("mongoose").Document<unknown, {}, import("../models/Category.js").ICategory, {}, import("mongoose").DefaultSchemaOptions> & import("../models/Category.js").ICategory & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }) | null, import("mongoose").Document<unknown, {}, import("../models/Category.js").ICategory, {}, import("mongoose").DefaultSchemaOptions> & import("../models/Category.js").ICategory & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }, {}, import("../models/Category.js").ICategory, "findOneAndUpdate", {}>;
    deleteCategory: (id: string) => import("mongoose").Query<(import("mongoose").Document<unknown, {}, import("../models/Category.js").ICategory, {}, import("mongoose").DefaultSchemaOptions> & import("../models/Category.js").ICategory & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }) | null, import("mongoose").Document<unknown, {}, import("../models/Category.js").ICategory, {}, import("mongoose").DefaultSchemaOptions> & import("../models/Category.js").ICategory & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }, {}, import("../models/Category.js").ICategory, "findOneAndUpdate", {}>;
    listFaqs: () => import("mongoose").Query<(import("mongoose").Document<unknown, {}, import("../models/Faq.js").IFaq, {}, import("mongoose").DefaultSchemaOptions> & import("../models/Faq.js").IFaq & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    })[], import("mongoose").Document<unknown, {}, import("../models/Faq.js").IFaq, {}, import("mongoose").DefaultSchemaOptions> & import("../models/Faq.js").IFaq & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }, {}, import("../models/Faq.js").IFaq, "find", {}>;
    createFaq: (data: Record<string, unknown>) => Promise<import("mongoose").Document<unknown, {}, import("../models/Faq.js").IFaq, {}, import("mongoose").DefaultSchemaOptions> & import("../models/Faq.js").IFaq & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    updateFaq: (id: string, data: Record<string, unknown>) => import("mongoose").Query<(import("mongoose").Document<unknown, {}, import("../models/Faq.js").IFaq, {}, import("mongoose").DefaultSchemaOptions> & import("../models/Faq.js").IFaq & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }) | null, import("mongoose").Document<unknown, {}, import("../models/Faq.js").IFaq, {}, import("mongoose").DefaultSchemaOptions> & import("../models/Faq.js").IFaq & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }, {}, import("../models/Faq.js").IFaq, "findOneAndUpdate", {}>;
    deleteFaq: (id: string) => import("mongoose").Query<(import("mongoose").Document<unknown, {}, import("../models/Faq.js").IFaq, {}, import("mongoose").DefaultSchemaOptions> & import("../models/Faq.js").IFaq & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }) | null, import("mongoose").Document<unknown, {}, import("../models/Faq.js").IFaq, {}, import("mongoose").DefaultSchemaOptions> & import("../models/Faq.js").IFaq & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }, {}, import("../models/Faq.js").IFaq, "findOneAndUpdate", {}>;
    listBanners: () => import("mongoose").Query<(import("mongoose").Document<unknown, {}, import("../models/Banner.js").IBanner, {}, import("mongoose").DefaultSchemaOptions> & import("../models/Banner.js").IBanner & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    })[], import("mongoose").Document<unknown, {}, import("../models/Banner.js").IBanner, {}, import("mongoose").DefaultSchemaOptions> & import("../models/Banner.js").IBanner & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }, {}, import("../models/Banner.js").IBanner, "find", {}>;
    createBanner: (data: Record<string, unknown>) => Promise<import("mongoose").Document<unknown, {}, import("../models/Banner.js").IBanner, {}, import("mongoose").DefaultSchemaOptions> & import("../models/Banner.js").IBanner & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    updateBanner: (id: string, data: Record<string, unknown>) => import("mongoose").Query<(import("mongoose").Document<unknown, {}, import("../models/Banner.js").IBanner, {}, import("mongoose").DefaultSchemaOptions> & import("../models/Banner.js").IBanner & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }) | null, import("mongoose").Document<unknown, {}, import("../models/Banner.js").IBanner, {}, import("mongoose").DefaultSchemaOptions> & import("../models/Banner.js").IBanner & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }, {}, import("../models/Banner.js").IBanner, "findOneAndUpdate", {}>;
    deleteBanner: (id: string) => import("mongoose").Query<(import("mongoose").Document<unknown, {}, import("../models/Banner.js").IBanner, {}, import("mongoose").DefaultSchemaOptions> & import("../models/Banner.js").IBanner & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }) | null, import("mongoose").Document<unknown, {}, import("../models/Banner.js").IBanner, {}, import("mongoose").DefaultSchemaOptions> & import("../models/Banner.js").IBanner & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }, {}, import("../models/Banner.js").IBanner, "findOneAndUpdate", {}>;
    listCoupons: () => import("mongoose").Query<(import("mongoose").Document<unknown, {}, import("../models/Coupon.js").ICoupon, {}, import("mongoose").DefaultSchemaOptions> & import("../models/Coupon.js").ICoupon & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    })[], import("mongoose").Document<unknown, {}, import("../models/Coupon.js").ICoupon, {}, import("mongoose").DefaultSchemaOptions> & import("../models/Coupon.js").ICoupon & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }, {}, import("../models/Coupon.js").ICoupon, "find", {}>;
    createCoupon: (data: Record<string, unknown>) => Promise<import("mongoose").Document<unknown, {}, import("../models/Coupon.js").ICoupon, {}, import("mongoose").DefaultSchemaOptions> & import("../models/Coupon.js").ICoupon & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    updateCoupon: (id: string, data: Record<string, unknown>) => import("mongoose").Query<(import("mongoose").Document<unknown, {}, import("../models/Coupon.js").ICoupon, {}, import("mongoose").DefaultSchemaOptions> & import("../models/Coupon.js").ICoupon & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }) | null, import("mongoose").Document<unknown, {}, import("../models/Coupon.js").ICoupon, {}, import("mongoose").DefaultSchemaOptions> & import("../models/Coupon.js").ICoupon & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }, {}, import("../models/Coupon.js").ICoupon, "findOneAndUpdate", {}>;
    deleteCoupon: (id: string) => import("mongoose").Query<(import("mongoose").Document<unknown, {}, import("../models/Coupon.js").ICoupon, {}, import("mongoose").DefaultSchemaOptions> & import("../models/Coupon.js").ICoupon & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }) | null, import("mongoose").Document<unknown, {}, import("../models/Coupon.js").ICoupon, {}, import("mongoose").DefaultSchemaOptions> & import("../models/Coupon.js").ICoupon & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }, {}, import("../models/Coupon.js").ICoupon, "findOneAndUpdate", {}>;
    listCommunityContent: (query: PaginationQuery) => Promise<import("../types/index.js").PaginatedResult<import("../models/CommunityQuestion.js").ICommunityQuestion>>;
};
export declare function seedDefaultSettings(): Promise<void>;
//# sourceMappingURL=admin.service.d.ts.map