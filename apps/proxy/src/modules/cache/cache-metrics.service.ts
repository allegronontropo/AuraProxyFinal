import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';
import type { CacheMetrics } from '@aura/shared';

const METRICS_PREFIX = 'aura:cache:metrics';

@Injectable()
export class CacheMetricsService {
  private readonly logger = new Logger(CacheMetricsService.name);

  constructor(private readonly redis: RedisService) {}

  async recordExactHit(model?: string): Promise<void> {
    try {
      await this.increment('exactHits', model);
    } catch (err) {
      this.logger.warn(`Failed to record exact cache hit: ${this.formatError(err)}`);
    }
  }

  async recordSemanticHit(model?: string): Promise<void> {
    try {
      await this.increment('semanticHits', model);
    } catch (err) {
      this.logger.warn(`Failed to record semantic cache hit: ${this.formatError(err)}`);
    }
  }

  async recordMiss(model?: string): Promise<void> {
    try {
      await this.increment('misses', model);
    } catch (err) {
      this.logger.warn(`Failed to record cache miss: ${this.formatError(err)}`);
    }
  }

  async recordEmbeddingCacheHit(model?: string): Promise<void> {
    try {
      await this.increment('embeddingHits', model);
    } catch (err) {
      this.logger.warn(`Failed to record embedding cache hit: ${this.formatError(err)}`);
    }
  }

  async recordEmbeddingCacheMiss(model?: string): Promise<void> {
    try {
      await this.increment('embeddingMisses', model);
    } catch (err) {
      this.logger.warn(`Failed to record embedding cache miss: ${this.formatError(err)}`);
    }
  }

  async recordHit(model?: string): Promise<void> {
    await this.recordSemanticHit(model);
  }

  async getMetrics(): Promise<CacheMetrics> {
    try {
      const exactHits = await this.getCounter('exactHits');
      const semanticHits = await this.getCounter('semanticHits');
      const misses = await this.getCounter('misses');
      const embeddingCacheHits = await this.getCounter('embeddingHits');
      const embeddingCacheMisses = await this.getCounter('embeddingMisses');
      const hits = exactHits + semanticHits;
      const total = hits + misses;

      return {
        hits,
        exactHits,
        semanticHits,
        misses,
        hitRate: total > 0 ? hits / total : 0,
        totalRequests: total,
        llmCallsAvoided: hits,
        embeddingCacheHits,
        embeddingCacheMisses,
        byModel: await this.getModelMetrics(),
      };
    } catch (err) {
      this.logger.warn(`Failed to get cache metrics: ${this.formatError(err)}`);
      return {
        hits: 0,
        exactHits: 0,
        semanticHits: 0,
        misses: 0,
        hitRate: 0,
        totalRequests: 0,
        llmCallsAvoided: 0,
        embeddingCacheHits: 0,
        embeddingCacheMisses: 0,
        byModel: {},
      };
    }
  }

  private async increment(metric: string, model?: string): Promise<void> {
    await this.redis.client.incr(`${METRICS_PREFIX}:${metric}`);
    if (model) {
      await this.redis.client.incr(`${METRICS_PREFIX}:${metric}:${model}`);
    }
  }

  private async getCounter(metric: string): Promise<number> {
    const value = await this.redis.client.get(`${METRICS_PREFIX}:${metric}`).catch(() => null);
    return value ? Number(value) || 0 : 0;
  }

  private async getModelMetrics(): Promise<CacheMetrics['byModel']> {
    const models = await this.getKnownModels();
    const byModel: CacheMetrics['byModel'] = {};

    for (const model of models) {
      byModel[model] = {
        exactHits: await this.getCounter(`exactHits:${model}`),
        semanticHits: await this.getCounter(`semanticHits:${model}`),
        misses: await this.getCounter(`misses:${model}`),
        embeddingCacheHits: await this.getCounter(`embeddingHits:${model}`),
        embeddingCacheMisses: await this.getCounter(`embeddingMisses:${model}`),
      };
    }

    return byModel;
  }

  private async getKnownModels(): Promise<string[]> {
    const models = new Set<string>();
    const metricNames = ['exactHits', 'semanticHits', 'misses', 'embeddingHits', 'embeddingMisses'];

    for (const metric of metricNames) {
      let cursor = '0';
      do {
        const result = await this.redis.client.scan(cursor, 'MATCH', `${METRICS_PREFIX}:${metric}:*`, 'COUNT', '100');
        cursor = result[0];
        for (const key of result[1]) {
          models.add(key.replace(`${METRICS_PREFIX}:${metric}:`, ''));
        }
      } while (cursor !== '0');
    }

    return [...models].sort();
  }

  private formatError(err: unknown): string {
    return err instanceof Error ? err.message : String(err);
  }
}
