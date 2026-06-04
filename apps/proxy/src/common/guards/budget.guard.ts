import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject, // Assurez-vous que Inject est bien là
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BudgetService } from '../../modules/budget/budget.service';

@Injectable()
export class BudgetGuard implements CanActivate {
  constructor(
    @Inject(BudgetService) private readonly budget: BudgetService,
    @Inject(EventEmitter2) private readonly eventEmitter: EventEmitter2, // <--- AJOUTEZ @Inject ICI
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

      throw new ForbiddenException({
        code: 'BUDGET_EXCEEDED',
        message: `Project budget exceeded ($${status.used.toFixed(2)} / $${status.limit.toFixed(2)}).`,
        details: status,
      });
    }

    return true;
  }
}
