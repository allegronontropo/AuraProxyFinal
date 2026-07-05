import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';
import { REDIS_KEYS } from '@aura/shared';
import { AlertsService } from '../../modules/alerts/alerts.service';

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
const RATE_LIMIT_SCRIPT = `
redis.call('ZREMRANGEBYSCORE', KEYS[1], 0, ARGV[2])

local count = tonumber(redis.call('ZCARD', KEYS[1]))
local limit = tonumber(ARGV[4])

if count >= limit then
  local oldest = redis.call('ZRANGE', KEYS[1], 0, 0, 'WITHSCORES')
  local retry_after = 60
  if oldest[2] then
    retry_after = math.ceil((tonumber(oldest[2]) + tonumber(ARGV[6]) - tonumber(ARGV[1])) / 1000)
    if retry_after < 1 then retry_after = 1 end
    if retry_after > 60 then retry_after = 60 end
  end
  return {0, retry_after, 0}
end

redis.call('ZADD', KEYS[1], ARGV[1], ARGV[3])
redis.call('EXPIRE', KEYS[1], ARGV[5])

return {1, limit - count - 1, math.ceil((tonumber(ARGV[1]) + tonumber(ARGV[6])) / 1000)}
`;

@Injectable()
export class RateLimiterGuard implements CanActivate {
  constructor(
    @Inject(RedisService) private readonly redis: RedisService,
    @Inject(AlertsService) private readonly alerts: AlertsService,
  ) {}

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

    const result = (await this.redis.client.eval(
      RATE_LIMIT_SCRIPT,
      1,
      key,
      now.toString(),
      windowStart.toString(),
      member,
      apiKey.rateLimit.toString(),
      '120',
      WINDOW_MS.toString(),
    )) as [number, number, number];

    const [allowed, value, resetAt] = result.map(Number) as [number, number, number];

    if (allowed !== 1) {
      const retryAfter = value;

      // Set rate limit headers
      response.header('Retry-After', retryAfter.toString());
      response.header('X-RateLimit-Limit', apiKey.rateLimit.toString());
      response.header('X-RateLimit-Remaining', '0');
      response.header(
        'X-RateLimit-Reset',
        Math.ceil((now + retryAfter * 1000) / 1000).toString(),
      );

      // Fire and forget alert
      this.alerts.createAlert({
        projectId: apiKey.projectId,
        severity: 'warning',
        title: 'Rate Limit Exceeded',
        source: 'RateLimiterGuard',
        description: `API Key exceeded rate limit of ${apiKey.rateLimit} req/min.`,
        metadata: { limit: apiKey.rateLimit, retryAfter }
      }).catch(err => console.error("Failed to create rate limit alert:", err));

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
    const remaining = Math.max(0, value);
    response.header('X-RateLimit-Limit', apiKey.rateLimit.toString());
    response.header('X-RateLimit-Remaining', remaining.toString());
    response.header('X-RateLimit-Reset', resetAt.toString());

    return true;
  }
}
