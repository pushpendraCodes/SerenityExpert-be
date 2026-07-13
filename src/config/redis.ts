import { createClient, RedisClientType } from "redis";

let redisClient: RedisClientType;

export const connectRedis = async (): Promise<RedisClientType> => {
  redisClient = createClient({
    username: process.env.REDIS_USERNAME || "default",
    password: process.env.REDIS_PASSWORD,
    socket: {
      host: process.env.REDIS_HOST,
      port: Number(process.env.REDIS_PORT) || 6379,
      reconnectStrategy: (retries: number) => {
        if (retries > 10) {
          console.error("❌ Redis: Max reconnection attempts reached");
          return new Error("Max reconnection attempts reached");
        }
        return Math.min(retries * 100, 3000);
      },
    },
  });

  redisClient.on("error", (err: Error) => {
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

export const getRedisClient = (): RedisClientType => {
  if (!redisClient) {
    throw new Error("Redis client not initialized. Call connectRedis() first.");
  }
  return redisClient;
};

export default redisClient!;
