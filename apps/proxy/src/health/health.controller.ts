import { Controller, Get, Inject } from '@nestjs/common';
import { HealthCheckService, HealthCheck, PrismaHealthIndicator, HealthCheckResult } from '@nestjs/terminus';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { CacheMetricsService } from '../modules/cache/cache-metrics.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

const startTime = Date.now();

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    @Inject(HealthCheckService) private health: HealthCheckService,
    @Inject(PrismaHealthIndicator) private prismaIndicator: PrismaHealthIndicator,
    @Inject(PrismaService) private prismaService: PrismaService,
    @Inject(RedisService) private redisService: RedisService,
    @Inject(CacheMetricsService) private cacheMetrics: CacheMetricsService,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Vérifier l\'état de santé du service' })
  async check(): Promise<HealthCheckResult> {
    const result = await this.health.check([
      () => this.prismaIndicator.pingCheck('database', this.prismaService.client),
      async () => {
        try {
          const pong = await this.redisService.client.ping();
          return { redis: { status: pong === 'PONG' ? 'up' : 'down' } };
        } catch (err: any) {
          return { redis: { status: 'down', message: err.message } };
        }
      },
      async () => ({
        uptime: { status: 'up', uptimeSeconds: Math.floor((Date.now() - startTime) / 1000) },
      }),
    ]);

    return result;
  }

  @Get('live')
  @ApiOperation({ summary: 'Sonde de vivacité simple (liveness)' })
  getLiveness() {
    return { status: 'ok' };
  }

  @Get('ready')
  @ApiOperation({ summary: 'Sonde de disponibilité simple (readiness)' })
  async getReadiness() {
    const dbOk = await this.prismaService.client.$queryRaw`SELECT 1`.then(() => true).catch(() => false);
    const redisOk = await this.redisService.client.ping().then((r) => r === 'PONG').catch(() => false);
    return {
      status: dbOk && redisOk ? 'ok' : 'degraded',
      database: dbOk ? 'connected' : 'disconnected',
      redis: redisOk ? 'connected' : 'disconnected',
    };
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Métrique Prometheus' })
  async getMetrics(): Promise<string> {
    const metrics = await this.cacheMetrics.getMetrics();
    const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);

    return [
      '# HELP aura_cache_hits_total Total cache hits',
      '# TYPE aura_cache_hits_total counter',
      `aura_cache_hits_total ${metrics.hits}`,
      '# HELP aura_cache_exact_hits_total Total exact cache hits',
      '# TYPE aura_cache_exact_hits_total counter',
      `aura_cache_exact_hits_total ${metrics.exactHits}`,
      '# HELP aura_cache_semantic_hits_total Total semantic cache hits',
      '# TYPE aura_cache_semantic_hits_total counter',
      `aura_cache_semantic_hits_total ${metrics.semanticHits}`,
      '# HELP aura_cache_misses_total Total cache misses',
      '# TYPE aura_cache_misses_total counter',
      `aura_cache_misses_total ${metrics.misses}`,
      '# HELP aura_embedding_cache_hits_total Total embedding cache hits',
      '# TYPE aura_embedding_cache_hits_total counter',
      `aura_embedding_cache_hits_total ${metrics.embeddingCacheHits}`,
      '# HELP aura_embedding_cache_misses_total Total embedding cache misses',
      '# TYPE aura_embedding_cache_misses_total counter',
      `aura_embedding_cache_misses_total ${metrics.embeddingCacheMisses}`,
      '# HELP aura_uptime_seconds Service uptime in seconds',
      '# TYPE aura_uptime_seconds gauge',
      `aura_uptime_seconds ${uptimeSeconds}`,
    ].join('\n') + '\n';
  }

@Get('stats')
  @ApiOperation({ summary: 'Statistiques JSON pour le tableau de bord' })
  async getStats() {
    const metrics = await this.cacheMetrics.getMetrics();
    const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);

    return {
      cache: {
        hits: metrics.hits,
        exactHits: metrics.exactHits,
        semanticHits: metrics.semanticHits,
        misses: metrics.misses,
        hitRate: metrics.hitRate,
        totalRequests: metrics.totalRequests,
        llmCallsAvoided: metrics.llmCallsAvoided,
        embeddingCacheHits: metrics.embeddingCacheHits,
        embeddingCacheMisses: metrics.embeddingCacheMisses,
        byModel: metrics.byModel,
      },
      uptime: uptimeSeconds,
    };
  }
}
