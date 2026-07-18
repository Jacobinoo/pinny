import { Redis } from '@upstash/redis';

// Initialize Redis client. This will automatically use UPSTASH_REDIS_REST_URL 
// and UPSTASH_REDIS_REST_TOKEN from the environment.
// We make it lazy/optional so the app doesn't crash if env vars aren't set yet.
let redis: Redis | null = null;
try {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = Redis.fromEnv();
  }
} catch (e) {
  console.error("Failed to initialize Redis:", e);
}

/**
 * Generic caching wrapper for Upstash Redis.
 * If Redis is not configured or an error occurs, it transparently falls back to the fetcher.
 * 
 * @param key The Redis cache key
 * @param fetcher The async function to fetch fresh data if cache misses
 * @param ttlSeconds Time-to-live in seconds (default 3600 = 1 hour)
 * @returns The cached or freshly fetched data
 */
export async function cachedFetch<T>(key: string, fetcher: () => Promise<T>, ttlSeconds: number = 3600): Promise<T> {
  if (!redis) {
    // Redis not configured, bypass cache
    return fetcher();
  }

  try {
    const cached = await redis.get<T>(key);
    if (cached) {
      console.log(`[Cache Hit] ${key}`);
      return cached;
    }
  } catch (err) {
    console.error(`[Cache Error] Failed to read ${key}:`, err);
    // On read error, gracefully degrade to fetching fresh data
  }

  console.log(`[Cache Miss] ${key} - Fetching fresh data`);
  const fresh = await fetcher();

  try {
    // Fire and forget the cache set so we don't block the response
    redis.set(key, fresh, { ex: ttlSeconds }).catch(err => {
      console.error(`[Cache Error] Failed to write ${key}:`, err);
    });
  } catch (err) {
    console.error(`[Cache Error] Failed to write ${key}:`, err);
  }

  return fresh;
}
