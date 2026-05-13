import { Module } from '@nestjs/common';
import { CacheService } from './cache.service';
import { EmbeddingsService } from './embeddings.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [CacheService, EmbeddingsService],
  exports: [CacheService],
})
export class CacheModule {}
