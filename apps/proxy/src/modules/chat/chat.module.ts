import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ProvidersModule } from '../providers/providers.module';
import { BudgetModule } from '../budget/budget.module';
import { CacheModule } from '../cache/cache.module';

@Module({
  imports: [ProvidersModule, BudgetModule, CacheModule],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
