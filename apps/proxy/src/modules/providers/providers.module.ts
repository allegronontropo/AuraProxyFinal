import { Module } from '@nestjs/common';
import { ProvidersService } from './providers.service';
import { PrismaModule } from '../../prisma/prisma.module'; 
/**
 * @pattern Strategy
 * Provider module registers all LLM providers and exposes them via DI.
 */
@Module({
  imports: [PrismaModule],
  providers: [ProvidersService],
  exports: [ProvidersService],
})
export class ProvidersModule {}
