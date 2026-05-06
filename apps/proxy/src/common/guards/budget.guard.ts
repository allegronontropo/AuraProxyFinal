import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { BudgetService } from '../../modules/budget/budget.service';

@Injectable()
export class BudgetGuard implements CanActivate {
  constructor(private readonly budget: BudgetService) {}

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
      throw new ForbiddenException({
        code: 'BUDGET_EXCEEDED',
        message: `Project budget exceeded ($${status.used.toFixed(2)} / $${status.limit.toFixed(2)}).`,
        details: status,
      });
    }

    return true;
  }
}
