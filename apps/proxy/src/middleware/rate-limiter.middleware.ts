/**
 * Rate Limiter Middleware — Sliding Window Algorithm
 *
 * Uses Redis sorted sets to implement a sliding window rate limiter.
 * Each API key has its own rate limit (requests per minute) defined
 * in the api_keys table.
 *
 * Algorithm:
 * 1. Use a sorted set keyed by apiKeyId
 * 2. Score = timestamp in milliseconds
 * 3. Remove entries older than 60 seconds
 * 4. Count remaining entries
 * 5. If count >= rateLimit → reject with 429 + Retry-After header
 * 6. Otherwise → add current timestamp and allow request
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import { redis } from '@aura/redis';
import { REDIS_KEYS } from '@aura/shared';

/** Sliding window size: 60 seconds */
const WINDOW_SIZE_MS = 60_000;

export async function rateLimiterMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const { apiKey } = request;

  // Skip rate limiting if no API key context (shouldn't happen after auth)
  if (!apiKey) {
    return;
  }

  const key = REDIS_KEYS.rateLimit(apiKey.keyId);
  const now = Date.now();
  const windowStart = now - WINDOW_SIZE_MS;

  // Use a pipeline for efficiency (3 operations in 1 round-trip)
  const pipeline = redis.pipeline();

  // 1. Remove expired entries (older than 60 seconds)
  pipeline.zremrangebyscore(key, 0, windowStart);

  // 2. Count current entries in the window
  pipeline.zcard(key);

  // 3. Add current request timestamp
  pipeline.zadd(key, now, `${now}:${Math.random().toString(36).slice(2, 8)}`);

  // 4. Set TTL on the key so it doesn't persist forever
  pipeline.expire(key, 120); // 2 minutes

  const results = await pipeline.exec();

  if (!results) {
    // Redis error — fail open (allow the request)
    request.log.error('Rate limiter: Redis pipeline returned null');
    return;
  }

  // zcard result is at index 1 (second command)
  const currentCount = results[1]?.[1] as number;

  if (currentCount >= apiKey.rateLimit) {
    // Calculate when the oldest entry in the window will expire
    const oldestEntries = await redis.zrangebyscore(key, windowStart, '+inf', 'LIMIT', 0, 1);
    let retryAfterSeconds = 60;

    if (oldestEntries.length > 0) {
      const oldestTimestamp = parseInt(oldestEntries[0].split(':')[0], 10);
      retryAfterSeconds = Math.ceil((oldestTimestamp + WINDOW_SIZE_MS - now) / 1000);
      retryAfterSeconds = Math.max(1, Math.min(retryAfterSeconds, 60));
    }

    // Remove the entry we just added since we're rejecting the request
    pipeline.zrem(key, `${now}:${Math.random().toString(36).slice(2, 8)}`);

    reply
      .status(429)
      .header('Retry-After', retryAfterSeconds.toString())
      .header('X-RateLimit-Limit', apiKey.rateLimit.toString())
      .header('X-RateLimit-Remaining', '0')
      .header('X-RateLimit-Reset', Math.ceil((now + retryAfterSeconds * 1000) / 1000).toString())
      .send({
        code: 'RATE_LIMIT_EXCEEDED',
        message: `Rate limit exceeded: ${apiKey.rateLimit} requests per minute. Retry after ${retryAfterSeconds} seconds.`,
        statusCode: 429,
        details: {
          limit: apiKey.rateLimit,
          remaining: 0,
          retryAfter: retryAfterSeconds,
          window: '60s',
        },
      });
    return;
  }

  // Set rate limit headers on successful requests
  const remaining = Math.max(0, apiKey.rateLimit - currentCount - 1);
  reply.header('X-RateLimit-Limit', apiKey.rateLimit.toString());
  reply.header('X-RateLimit-Remaining', remaining.toString());
  reply.header('X-RateLimit-Reset', Math.ceil((now + WINDOW_SIZE_MS) / 1000).toString());
}
