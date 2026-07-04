import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { StreamingService } from './streaming.service';
import { ProvidersModule } from '../providers/providers.module';
import { BudgetModule } from '../budget/budget.module';
import { CacheModule } from '../cache/cache.module';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { AlertsModule } from '../alerts/alerts.module';

@Module({
  imports: [ProvidersModule, BudgetModule, CacheModule, AuthModule, PrismaModule, AlertsModule],
  controllers: [ChatController],
  providers: [ChatService, StreamingService],
})
export class ChatModule {}
