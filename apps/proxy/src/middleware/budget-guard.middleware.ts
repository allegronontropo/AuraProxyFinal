/**
 * Budget Guard Middleware
 *
 * Fastify preHandler hook that runs after auth middleware.
 * Checks if the project has exceeded its budget limit before
 * allowing the request to proceed.
 *
 * Uses the BudgetService to read the Redis-backed budget counter
 * and returns 429 if the budget has been exceeded.
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import { budgetService } from '../services/budget.service.js';

export async function budgetGuardMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const { project } = request;

  // Skip budget check if no project context (shouldn't happen after auth)
  if (!project) {
    return;
  }

  const status = await budgetService.checkBudget(
    project.id,
    project.budgetLimit,
    project.budgetPeriod
  );

  if (status.exceeded) {
    // Prepare the hook for future event system (Phase 6)
    // eventBus.emit('budget.exceeded', { projectId: project.id, used: status.used, limit: status.limit });

    reply.status(429).send({
      code: 'BUDGET_EXCEEDED',
      message: `Budget limit exceeded. Used: $${status.used.toFixed(4)} / $${status.limit.toFixed(2)} (${status.period.toLowerCase()} budget)`,
      statusCode: 429,
      details: {
        used: status.used,
        limit: status.limit,
        remaining: 0,
        period: status.period,
        resetsIn: 'End of current budget period',
      },
    });
    return;
  }

  // Log budget warning if over 80%
  if (status.used / status.limit > 0.8) {
    request.log.warn(
      {
        projectId: project.id,
        used: status.used,
        limit: status.limit,
        percentUsed: ((status.used / status.limit) * 100).toFixed(1),
      },
      'Budget warning: over 80% usage'
    );
    // Prepare the hook for future event system
    // eventBus.emit('budget.warning', { projectId: project.id, used: status.used, limit: status.limit });
  }
}
