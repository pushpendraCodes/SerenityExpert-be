import { getRedisClient } from "../config/redis.js";

export async function cacheGet<T>(key: string): Promise<T | null> {
  const redis = getRedisClient();
  const data = await redis.get(key);
  if (!data) return null;
  return JSON.parse(data) as T;
}

export async function cacheSet(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
  const redis = getRedisClient();
  const serialized = JSON.stringify(value);
  if (ttlSeconds) {
    await redis.setEx(key, ttlSeconds, serialized);
  } else {
    await redis.set(key, serialized);
  }
}

export async function cacheDel(key: string): Promise<void> {
  const redis = getRedisClient();
  await redis.del(key);
}

export async function cacheDelPattern(pattern: string): Promise<void> {
  const redis = getRedisClient();
  const keys = await redis.keys(pattern);
  if (keys.length > 0) {
    await redis.del(keys);
  }
}

export const CacheKeys = {
  activeCall: (callId: string) => `call:active:${callId}`,
  expertStatus: (expertId: string) => `expert:status:${expertId}`,
  settings: () => "admin:settings",
  liveCalls: () => "admin:live-calls",
};
