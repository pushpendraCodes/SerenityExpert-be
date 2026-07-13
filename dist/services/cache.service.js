"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheKeys = void 0;
exports.cacheGet = cacheGet;
exports.cacheSet = cacheSet;
exports.cacheDel = cacheDel;
exports.cacheDelPattern = cacheDelPattern;
const redis_js_1 = require("../config/redis.js");
async function cacheGet(key) {
    const redis = (0, redis_js_1.getRedisClient)();
    const data = await redis.get(key);
    if (!data)
        return null;
    return JSON.parse(data);
}
async function cacheSet(key, value, ttlSeconds) {
    const redis = (0, redis_js_1.getRedisClient)();
    const serialized = JSON.stringify(value);
    if (ttlSeconds) {
        await redis.setEx(key, ttlSeconds, serialized);
    }
    else {
        await redis.set(key, serialized);
    }
}
async function cacheDel(key) {
    const redis = (0, redis_js_1.getRedisClient)();
    await redis.del(key);
}
async function cacheDelPattern(pattern) {
    const redis = (0, redis_js_1.getRedisClient)();
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
        await redis.del(keys);
    }
}
exports.CacheKeys = {
    activeCall: (callId) => `call:active:${callId}`,
    expertStatus: (expertId) => `expert:status:${expertId}`,
    settings: () => "admin:settings",
    liveCalls: () => "admin:live-calls",
};
//# sourceMappingURL=cache.service.js.map