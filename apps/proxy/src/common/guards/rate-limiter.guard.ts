import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';
import { REDIS_KEYS } from '@aura/shared';

/**
 * @pattern Decorator
 * RateLimiterGuard — Sliding Window Rate Limiter via Redis sorted sets.
 *
 * Algorithm:
 * 1. Key = sorted set keyed by apiKeyId (score = timestamp ms)
 * 2. Remove entries older than 60s window (ZREMRANGEBYSCORE)
 * 3. Count current entries (ZCARD)
 * 4. If count >= rateLimit → 429 + Retry-After header
 * 5. Otherwise → ZADD current timestamp + allow
 */

const WINDOW_MS = 60_000; // 60 seconds

@Injectable()
export class RateLimiterGuard implements CanActivate {
  constructor(private readonly redis: RedisService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const apiKey = request.apiKey;

    // Skip if no apiKey context (AuthGuard must run first)
    if (!apiKey) {
      return true;
    }

    const key = REDIS_KEYS.rateLimit(apiKey.keyId);
    const now = Date.now();
    const windowStart = now - WINDOW_MS;
    const member = `${now}:${Math.random().toString(36).slice(2, 8)}`;

    // Pipeline: remove stale, count, add current, set TTL
    const pipeline = this.redis.client.pipeline();
    pipeline.zremrangebyscore(key, 0, windowStart);
    pipeline.zcard(key);
    pipeline.zadd(key, now, member);
    pipeline.expire(key, 120); // 2-minute TTL safety net

    const results = await pipeline.exec();

    if (!results) {
      // Redis unavailable — fail open
      return true;
    }

    // zcard result is index 1 (before we added the current request)
    const countBeforeAdd = results[1]?.[1] as number;

    if (countBeforeAdd >= apiKey.rateLimit) {
      // Remove the entry we just added since we're rejecting
      await this.redis.client.zrem(key, member);

      // Compute Retry-After from oldest entry in the window
      const oldest = await this.redis.client.zrangebyscore(
        key,
        windowStart,
        '+inf',
        'LIMIT',
        0,
        1,
      );
      let retryAfter = 60;
      if (oldest.length > 0) {
        const oldestTs = parseInt(oldest[0].split(':')[0], 10);
        retryAfter = Math.ceil((oldestTs + WINDOW_MS - now) / 1000);
        retryAfter = Math.max(1, Math.min(retryAfter, 60));
      }

      // Set rate limit headers
      response.header('Retry-After', retryAfter.toString());
      response.header('X-RateLimit-Limit', apiKey.rateLimit.toString());
      response.header('X-RateLimit-Remaining', '0');
      response.header(
        'X-RateLimit-Reset',
        Math.ceil((now + retryAfter * 1000) / 1000).toString(),
      );

      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          code: 'RATE_LIMIT_EXCEEDED',
          message: `Limite de débit dépassée : ${apiKey.rateLimit} requêtes/min. Réessayez dans ${retryAfter}s.`,
          details: {
            limit: apiKey.rateLimit,
            remaining: 0,
            retryAfter,
            window: '60s',
          },
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Set success rate limit headers
    const remaining = Math.max(0, apiKey.rateLimit - countBeforeAdd - 1);
    response.header('X-RateLimit-Limit', apiKey.rateLimit.toString());
    response.header('X-RateLimit-Remaining', remaining.toString());
    response.header(
      'X-RateLimit-Reset',
      Math.ceil((now + WINDOW_MS) / 1000).toString(),
    );

    return true;
  }
}
