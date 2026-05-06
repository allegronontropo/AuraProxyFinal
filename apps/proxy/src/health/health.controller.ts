import { Controller, Get } from '@nestjs/common';
import { HealthCheckService, HealthCheck, PrismaHealthIndicator, HealthCheckResult } from '@nestjs/terminus';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private prismaIndicator: PrismaHealthIndicator,
    private prismaService: PrismaService,
    private redisService: RedisService,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Check service health' })
  async check(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.prismaIndicator.pingCheck('database', this.prismaService.client),
      async () => {
        try {
          const pong = await this.redisService.client.ping();
          return { redis: { status: pong === 'PONG' ? 'up' : 'down' } };
        } catch (err: any) {
          return { redis: { status: 'down', message: err.message } };
        }
      },
    ]);
  }
}
