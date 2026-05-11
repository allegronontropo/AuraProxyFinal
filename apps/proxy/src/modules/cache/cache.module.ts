import { Module } from '@nestjs/common';
import { CacheService } from './cache.service.js';
import { EmbeddingsService } from './embeddings.service.js';
import { PrismaModule } from '../../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  providers: [CacheService, EmbeddingsService],
  exports: [CacheService],
})
export class CacheModule {}
