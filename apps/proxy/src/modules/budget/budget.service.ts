import { Injectable } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';
import { PrismaService } from '../../prisma/prisma.service';
import { REDIS_KEYS } from '@aura/shared';
import type { BudgetStatus } from '@aura/shared';
import { Granularity } from '@aura/db';

@Injectable()
export class BudgetService {
  constructor(
    private readonly redis: RedisService,
    private readonly prisma: PrismaService,
  ) {}

  async checkBudget(
    projectId: string,
    budgetLimit: number,
    budgetPeriod: 'DAILY' | 'WEEKLY' | 'MONTHLY'
  ): Promise<BudgetStatus> {
    const key = REDIS_KEYS.budget(projectId);
    const rawUsed = await this.redis.client.get(key);
    const used = rawUsed ? parseFloat(rawUsed) : 0;
    const remaining = Math.max(0, budgetLimit - used);

    return {
      projectId,
      used,
      limit: budgetLimit,
      remaining,
      period: budgetPeriod,
      exceeded: used >= budgetLimit,
    };
  }

  async recordSpend(
    projectId: string,
    costUsd: number,
    budgetPeriod: 'DAILY' | 'WEEKLY' | 'MONTHLY'
  ): Promise<void> {
    if (costUsd <= 0) return;

    const key = REDIS_KEYS.budget(projectId);
    await this.redis.client.incrbyfloat(key, costUsd);

    const ttl = await this.redis.client.ttl(key);
    if (ttl === -1) {
      const expiry = this.getPeriodTTL(budgetPeriod);
      await this.redis.client.expire(key, expiry);
    }

    await this.persistUsage(projectId, costUsd);
  }

  async resetBudget(projectId: string): Promise<void> {
    const key = REDIS_KEYS.budget(projectId);
    await this.redis.client.del(key);
  }

  private async persistUsage(projectId: string, cost: number): Promise<void> {
    const now = new Date();
    const period = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours());

    await this.prisma.client.usageRecord.upsert({
      where: {
        projectId_period_granularity: {
          projectId,
          period,
          granularity: Granularity.HOURLY,
        },
      },
      update: {
        totalCostUsd: { increment: cost },
        totalRequests: { increment: 1 },
      },
      create: {
        projectId,
        period,
        granularity: Granularity.HOURLY,
        totalCostUsd: cost,
        totalRequests: 1,
      },
    });
  }

  private getPeriodTTL(period: 'DAILY' | 'WEEKLY' | 'MONTHLY'): number {
    switch (period) {
      case 'DAILY':
        return 86400;
      case 'WEEKLY':
        return 604800;
      case 'MONTHLY':
        return 2592000;
      default:
        return 2592000;
    }
  }
}
