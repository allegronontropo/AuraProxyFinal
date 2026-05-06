/**
 * Budget Service
 *
 * Manages per-project budget tracking using Redis for real-time counters
 * with PostgreSQL as the source of truth for budget limits.
 *
 * Budget counters are stored in Redis using INCRBYFLOAT for atomic
 * spend recording. The counter key includes the budget period so
 * resets happen naturally when the period rolls over.
 */

import { redis } from '@aura/redis';
import { REDIS_KEYS } from '@aura/shared';
import type { BudgetStatus } from '@aura/shared';

export class BudgetService {
  /**
   * Check whether a project has exceeded its budget.
   */
  async checkBudget(
    projectId: string,
    budgetLimit: number,
    budgetPeriod: 'DAILY' | 'WEEKLY' | 'MONTHLY'
  ): Promise<BudgetStatus> {
    const key = REDIS_KEYS.budget(projectId);
    const rawUsed = await redis.get(key);
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

  /**
   * Record spend for a project. Uses INCRBYFLOAT for atomic increment.
   * Sets a TTL on first spend so the counter auto-resets at the end of the period.
   */
  async recordSpend(
    projectId: string,
    costUsd: number,
    budgetPeriod: 'DAILY' | 'WEEKLY' | 'MONTHLY'
  ): Promise<void> {
    if (costUsd <= 0) return;

    const key = REDIS_KEYS.budget(projectId);

    // Atomic increment
    await redis.incrbyfloat(key, costUsd);

    // Set TTL if key doesn't have one yet (first spend in the period)
    const ttl = await redis.ttl(key);
    if (ttl === -1) {
      const expiry = this.getPeriodTTL(budgetPeriod);
      await redis.expire(key, expiry);
    }
  }

  /**
   * Manually reset the budget counter for a project.
   */
  async resetBudget(projectId: string): Promise<void> {
    const key = REDIS_KEYS.budget(projectId);
    await redis.del(key);
  }

  /**
   * Get the full budget status for a project.
   */
  async getBudgetStatus(
    projectId: string,
    budgetLimit: number,
    budgetPeriod: 'DAILY' | 'WEEKLY' | 'MONTHLY'
  ): Promise<BudgetStatus> {
    return this.checkBudget(projectId, budgetLimit, budgetPeriod);
  }

  /**
   * Calculate TTL in seconds for a given budget period.
   */
  private getPeriodTTL(period: 'DAILY' | 'WEEKLY' | 'MONTHLY'): number {
    switch (period) {
      case 'DAILY':
        return 86400; // 24 hours
      case 'WEEKLY':
        return 604800; // 7 days
      case 'MONTHLY':
        return 2592000; // 30 days
      default:
        return 2592000;
    }
  }
}

// Singleton instance
export const budgetService = new BudgetService();
