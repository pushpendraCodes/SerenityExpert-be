"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRedisClient = exports.connectRedis = void 0;
const redis_1 = require("redis");
let redisClient;
const connectRedis = async () => {
    redisClient = (0, redis_1.createClient)({
        username: process.env.REDIS_USERNAME || "default",
        password: process.env.REDIS_PASSWORD,
        socket: {
            host: process.env.REDIS_HOST,
            port: Number(process.env.REDIS_PORT) || 6379,
            reconnectStrategy: (retries) => {
                if (retries > 10) {
                    console.error("❌ Redis: Max reconnection attempts reached");
                    return new Error("Max reconnection attempts reached");
                }
                return Math.min(retries * 100, 3000);
            },
        },
    });
    redisClient.on("error", (err) => {
        console.error("❌ Redis Client Error:", err.message);
    });
    redisClient.on("connect", () => {
        console.log("🔌 Connecting to Redis...");
    });
    redisClient.on("ready", () => {
        console.log("✅ Redis connected successfully!");
    });
    redisClient.on("reconnecting", () => {
        console.log("🔄 Redis reconnecting...");
    });
    await redisClient.connect();
    return redisClient;
};
exports.connectRedis = connectRedis;
const getRedisClient = () => {
    if (!redisClient) {
        throw new Error("Redis client not initialized. Call connectRedis() first.");
    }
    return redisClient;
};
exports.getRedisClient = getRedisClient;
exports.default = redisClient;
//# sourceMappingURL=redis.js.map