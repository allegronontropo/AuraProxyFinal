import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';
import type { CacheMetrics } from '@aura/shared';

const METRICS_PREFIX = 'aura:cache:metrics';

@Injectable()
export class CacheMetricsService {
  private readonly logger = new Logger(CacheMetricsService.name);

  constructor(private readonly redis: RedisService) {}

  async recordHit(model?: string): Promise<void> {
    try {
      await this.redis.client.incr(`${METRICS_PREFIX}:hits`);
      if (model) {
        await this.redis.client.incr(`${METRICS_PREFIX}:hits:${model}`);
      }
    } catch (err) {
      this.logger.warn(`Failed to record cache hit: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  async recordMiss(model?: string): Promise<void> {
    try {
      await this.redis.client.incr(`${METRICS_PREFIX}:misses`);
      if (model) {
        await this.redis.client.incr(`${METRICS_PREFIX}:misses:${model}`);
      }
    } catch (err) {
      this.logger.warn(`Failed to record cache miss: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  async getMetrics(): Promise<CacheMetrics> {
    try {
      const hits = await this.redis.client.get(`${METRICS_PREFIX}:hits`).then(Number).catch(() => 0);
      const misses = await this.redis.client.get(`${METRICS_PREFIX}:misses`).then(Number).catch(() => 0);
      const total = hits + misses;

      const byModel: Record<string, { hits: number; misses: number }> = {};
      const modelHitsKeys: string[] = [];
      let cursor = '0';
      do {
        const result = await this.redis.client.scan(cursor, 'MATCH', `${METRICS_PREFIX}:hits:*`, 'COUNT', '100');
        cursor = result[0];
        modelHitsKeys.push(...result[1]);
      } while (cursor !== '0');

      for (const key of modelHitsKeys) {
        const model = key.replace(`${METRICS_PREFIX}:hits:`, '');
        const modelHits = await this.redis.client.get(key).then(Number).catch(() => 0);
        byModel[model] = { hits: modelHits, misses: 0 };
      }

      return {
        hits,
        misses,
        hitRate: total > 0 ? hits / total : 0,
        totalRequests: total,
        byModel,
      };
    } catch (err) {
      this.logger.warn(`Failed to get cache metrics: ${err instanceof Error ? err.message : String(err)}`);
      return { hits: 0, misses: 0, hitRate: 0, totalRequests: 0, byModel: {} };
    }
  }
}