import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { RedisModule } from '../redis/redis.module';
import { CacheModule } from '../modules/cache/cache.module';

@Module({
  imports: [TerminusModule, PrismaModule, RedisModule, CacheModule],
  controllers: [HealthController],
})
export class HealthModule {}
