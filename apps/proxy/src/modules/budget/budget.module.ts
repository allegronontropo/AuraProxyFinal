import { Module } from '@nestjs/common';
import { BudgetService } from './budget.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { RedisModule } from '../../redis/redis.module';

@Module({
  imports: [PrismaModule, RedisModule],
  providers: [BudgetService],
  exports: [BudgetService],
})
export class BudgetModule {}
