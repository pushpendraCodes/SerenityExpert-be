export declare function cacheGet<T>(key: string): Promise<T | null>;
export declare function cacheSet(key: string, value: unknown, ttlSeconds?: number): Promise<void>;
export declare function cacheDel(key: string): Promise<void>;
export declare function cacheDelPattern(pattern: string): Promise<void>;
export declare const CacheKeys: {
    activeCall: (callId: string) => string;
    expertStatus: (expertId: string) => string;
    settings: () => string;
    liveCalls: () => string;
};
//# sourceMappingURL=cache.service.d.ts.map