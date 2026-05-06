/**
 * @aura/redis — Singleton Redis Client
 *
 * Design Pattern: Singleton
 * Ensures a single Redis connection is shared across the application.
 * Uses ioredis with automatic reconnection and error handling.
 */

import Redis from 'ioredis';

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

function createRedisClient(): Redis {
  const url = process.env.REDIS_URL || 'redis://localhost:6379';

  const client = new Redis(url, {
    maxRetriesPerRequest: 3,
    retryStrategy(times: number) {
      if (times > 10) {
        console.error('[Redis] Max reconnection attempts reached');
        return null; // Stop retrying
      }
      const delay = Math.min(times * 200, 5000);
      console.warn(`[Redis] Reconnecting in ${delay}ms (attempt ${times})`);
      return delay;
    },
    lazyConnect: false,
  });

  client.on('connect', () => {
    console.log('[Redis] Connected');
  });

  client.on('error', (err: Error) => {
    console.error('[Redis] Error:', err.message);
  });

  return client;
}

export const redis = globalForRedis.redis ?? createRedisClient();

if (process.env.NODE_ENV !== 'production') {
  globalForRedis.redis = redis;
}

export default redis;
export { Redis };
