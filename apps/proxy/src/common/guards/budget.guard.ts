import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject, // Assurez-vous que Inject est bien là
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BudgetService } from '../../modules/budget/budget.service';
import { AlertsService } from '../../modules/alerts/alerts.service';

@Injectable()
export class BudgetGuard implements CanActivate {
  constructor(
    @Inject(BudgetService) private readonly budget: BudgetService,
    @Inject(EventEmitter2) private readonly eventEmitter: EventEmitter2, // <--- AJOUTEZ @Inject ICI
    @Inject(AlertsService) private readonly alerts: AlertsService,
  ) {}


  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const project = request.project;

    if (!project) {
      // Should have been attached by AuthGuard
      return true;
    }

    const status = await this.budget.checkBudget(
      project.id,
      project.budgetLimit,
      project.budgetPeriod
    );

    if (status.exceeded) {
      this.eventEmitter.emit('budget.exceeded', {
        projectId: project.id,
        tenantId: project.tenantId,
        limit: project.budgetLimit,
        used: status.used,
      });

      await this.alerts.createAlert({
        projectId: project.id,
        severity: 'critical',
        title: 'Budget Limit Exceeded',
        source: 'BudgetGuard',
        description: `Project budget exceeded ($${status.used.toFixed(2)} / $${status.limit.toFixed(2)}).`,
        metadata: { limit: status.limit, used: status.used }
      }).catch(err => console.error("Failed to create budget alert:", err));

      throw new ForbiddenException({
        code: 'BUDGET_EXCEEDED',
        message: `Project budget exceeded ($${status.used.toFixed(2)} / $${status.limit.toFixed(2)}).`,
        details: status,
      });
    }

    return true;
  }
}
