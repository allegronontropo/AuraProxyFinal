import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { EmbeddingsService } from './embeddings.service.js';
import { ConfigService } from '@nestjs/config';
import type { ChatResponse } from '@aura/shared';
import * as crypto from 'crypto';

@Injectable()
export class CacheService {
  private threshold: number;

  constructor(
    private prisma: PrismaService,
    private embeddings: EmbeddingsService,
    private configService: ConfigService,
  ) {
    this.threshold = this.configService.get<number>('CACHE_SIMILARITY_THRESHOLD', 0.95);
  }

  private hashPrompt(prompt: string): string {
    return crypto.createHash('sha256').update(prompt).digest('hex');
  }

  /**
   * Find a cached response using semantic similarity.
   */
  async find(prompt: string, model: string): Promise<ChatResponse | null> {
    const embedding = await this.embeddings.generate(prompt);
    const vectorString = `[${embedding.join(',')}]`;

    // Semantic search using cosine similarity via pgvector
    // <=> is the cosine distance operator. 1 - distance = similarity.
    const results = await this.prisma.client.$queryRaw<any[]>`
      SELECT 
        id,
        response,
        hit_count,
        1 - (embedding <=> ${vectorString}::vector) as similarity
      FROM semantic_cache
      WHERE 1 - (embedding <=> ${vectorString}::vector) > ${this.threshold}
        AND model = ${model}
        AND expires_at > NOW()
      ORDER BY similarity DESC
      LIMIT 1
    `;

    if (results.length > 0) {
      const hit = results[0];
      
      // Update hit count asynchronously
      this.prisma.client.semanticCache.update({
        where: { id: hit.id },
        data: { hitCount: { increment: 1 } },
      }).catch((err: Error) => console.error('[CacheService] Failed to update cache hit count', err));

      return hit.response as unknown as ChatResponse;
    }

    return null;
  }

  /**
   * Store a response in the semantic cache.
   */
  async set(prompt: string, model: string, response: ChatResponse, ttlDays = 7): Promise<void> {
    const embedding = await this.embeddings.generate(prompt);
    const promptHash = this.hashPrompt(prompt);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + ttlDays);
    const id = `cache_${crypto.randomUUID()}`;

    const vectorString = `[${embedding.join(',')}]`;

    // Insert or update using raw SQL to handle the vector column
    await this.prisma.client.$executeRaw`
      INSERT INTO semantic_cache (id, prompt_hash, model, embedding, response, expires_at, created_at)
      VALUES (
        ${id}, 
        ${promptHash}, 
        ${model}, 
        ${vectorString}::vector, 
        ${JSON.stringify(response)}::jsonb, 
        ${expiresAt},
        NOW()
      )
      ON CONFLICT (prompt_hash) DO UPDATE SET
        embedding = EXCLUDED.embedding,
        response = EXCLUDED.response,
        expires_at = EXCLUDED.expires_at,
        hit_count = semantic_cache.hit_count + 1
    `;
  }
}
