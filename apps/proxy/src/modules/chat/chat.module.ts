import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { StreamingService } from './streaming.service';
import { ProvidersModule } from '../providers/providers.module';
import { BudgetModule } from '../budget/budget.module';
import { CacheModule } from '../cache/cache.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [ProvidersModule, BudgetModule, CacheModule, AuthModule],
  controllers: [ChatController],
  providers: [ChatService, StreamingService],
})
export class ChatModule {}
