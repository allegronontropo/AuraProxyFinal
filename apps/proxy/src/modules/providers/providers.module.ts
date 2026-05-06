import { Module } from '@nestjs/common';
import { ProvidersService } from './providers.service';

/**
 * @pattern Strategy
 * Provider module registers all LLM providers and exposes them via DI.
 */
@Module({
  providers: [ProvidersService],
  exports: [ProvidersService],
})
export class ProvidersModule {}
