import { Module } from '@nestjs/common';
import { CacheService } from './cache.service';
import { EmbeddingsService } from './embeddings.service';
import { CacheMetricsService } from './cache-metrics.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { RedisModule } from '../../redis/redis.module';

@Module({
  imports: [PrismaModule, RedisModule],
  providers: [CacheService, EmbeddingsService, CacheMetricsService],
  exports: [CacheService, CacheMetricsService],
})
export class CacheModule {}
