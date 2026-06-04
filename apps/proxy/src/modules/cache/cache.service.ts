import { Injectable, OnModuleInit, Inject, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EmbeddingsService } from './embeddings.service';
import { ConfigService } from '@nestjs/config';
import type { ChatResponse } from '@aura/shared';
import * as crypto from 'crypto';

export interface CacheLookupInput {
  projectId: string;
  provider: string;
  model: string;
  prompt: string;
  parametersHash: string;
}

@Injectable()
export class CacheService implements OnModuleInit {
  private readonly logger = new Logger(CacheService.name);
  private threshold!: number;

  constructor(
    @Inject(PrismaService) private prisma: PrismaService,
    @Inject(EmbeddingsService) private embeddings: EmbeddingsService,
    @Inject(ConfigService) private configService: ConfigService,
  ) {}

  onModuleInit() {
    this.threshold = this.configService.get<number>('CACHE_SIMILARITY_THRESHOLD', 0.95);
  }

  private hashPrompt(prompt: string): string {
    return crypto.createHash('sha256').update(prompt).digest('hex');
  }

  hashParameters(parameters: Record<string, unknown>): string {
    const stable = Object.keys(parameters)
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = parameters[key];
        return acc;
      }, {});

    return crypto.createHash('sha256').update(JSON.stringify(stable)).digest('hex');
  }

  /**
   * Find a cached response using two levels:
   * 1. Exact Match (Fast path)
   * 2. Semantic Similarity using pgvector (AI path)
   */
  async find(input: CacheLookupInput): Promise<ChatResponse | null> {
    const promptHash = this.hashPrompt(input.prompt);

    // 1. FAST PATH: Exact Match (No embedding needed)
    const exactMatch = await this.prisma.client.semanticCache.findUnique({
      where: {
        projectId_model_provider_promptHash_parametersHash: {
          projectId: input.projectId,
          model: input.model,
          provider: input.provider,
          promptHash,
          parametersHash: input.parametersHash,
        }
      }
    });

    if (exactMatch && exactMatch.expiresAt > new Date()) {
      this.logger.log(`CACHE HIT (Exact Match) for model ${input.model} in project ${input.projectId}`);
      this.updateHitCount(exactMatch.id);
      return exactMatch.response as unknown as ChatResponse;
    }

    // 2. AI PATH: Semantic Similarity (Needs embedding generation)
    try {
      const queryVector = await this.embeddings.generate(input.prompt);
      const vectorString = `[${queryVector.join(',')}]`;

      // Semantic search using cosine similarity via pgvector
      // <=> is the cosine distance operator. 1 - distance = similarity.
      const results = await this.prisma.client.$queryRaw<any[]>`
        SELECT 
          id,
          response,
          1 - (embedding <=> ${vectorString}::vector) as similarity
        FROM semantic_cache
        WHERE project_id = ${input.projectId}
          AND provider = ${input.provider}
          AND model = ${input.model}
          AND expires_at > NOW()
          AND 1 - (embedding <=> ${vectorString}::vector) > ${this.threshold}::float
        ORDER BY similarity DESC
        LIMIT 1
      `;

      if (results.length > 0) {
        const semanticHit = results[0];
        this.logger.log(`CACHE HIT (Semantic: ${semanticHit.similarity.toFixed(4)}) for model ${input.model}`);
        this.updateHitCount(semanticHit.id);
        return semanticHit.response as unknown as ChatResponse;
      }
    } catch (err: any) {
      this.logger.warn(`Semantic cache lookup failed: ${err.message}`);
    }

    this.logger.log(`CACHE MISS for model ${input.model} in project ${input.projectId}`);
    return null;
  }

  /**
   * Store a response in the semantic cache with its embedding vector.
   */
  async set(input: CacheLookupInput, response: ChatResponse, ttlDays = 7): Promise<void> {
    try {
      const vector = await this.embeddings.generate(input.prompt);
      const promptHash = this.hashPrompt(input.prompt);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + ttlDays);
      const id = `cache_${crypto.randomUUID()}`;

      const vectorString = `[${vector.join(',')}]`;

      // Insert or update using raw SQL to handle the vector column
      await this.prisma.client.$executeRaw`
        INSERT INTO semantic_cache (id, project_id, provider, prompt_hash, parameters_hash, model, embedding, response, expires_at, created_at)
        VALUES (
          ${id}, 
          ${input.projectId},
          ${input.provider},
          ${promptHash}, 
          ${input.parametersHash},
          ${input.model}, 
          ${vectorString}::vector, 
          ${JSON.stringify(response)}::jsonb, 
          ${expiresAt},
          NOW()
        )
        ON CONFLICT (project_id, provider, model, prompt_hash, parameters_hash) DO UPDATE SET
          embedding = EXCLUDED.embedding,
          response = EXCLUDED.response,
          expires_at = EXCLUDED.expires_at
      `;
      this.logger.log(`Stored cache entry for prompt hash: ${promptHash}`);
    } catch (err: any) {
      this.logger.error(`Failed to store cache entry: ${err.message}`);
    }
  }

  private updateHitCount(id: string) {
    this.prisma.client.semanticCache.update({
      where: { id },
      data: { hitCount: { increment: 1 } },
    }).catch((err: Error) => this.logger.error(`Failed to update cache hit count: ${err.message}`));
  }
}
