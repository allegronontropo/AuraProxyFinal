import { Injectable, OnModuleInit, Inject, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EmbeddingsService } from './embeddings.service';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../../redis/redis.service';
import type { ChatResponse } from '@aura/shared';
import * as crypto from 'crypto';

export interface CacheLookupResult {
  hit: boolean;
  kind: 'exact' | 'semantic' | 'miss';
  similarityScore?: number;
  response?: ChatResponse | null;
  queryVector?: number[];
}

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

  // L1 in-process cache: zero network overhead for hot entries
  private readonly l1Cache = new Map<string, { response: ChatResponse; expiresAt: number }>();
  private readonly L1_MAX_ENTRIES = 1000;
  private readonly L1_TTL_MS = 5 * 60 * 1000; // 5 minutes

  constructor(
    @Inject(PrismaService) private prisma: PrismaService,
    @Inject(EmbeddingsService) private embeddings: EmbeddingsService,
    @Inject(ConfigService) private configService: ConfigService,
    @Inject(RedisService) private redis: RedisService,
  ) {}

  onModuleInit() {
    this.threshold = this.configService.get<number>('CACHE_SIMILARITY_THRESHOLD', 0.95);
  }

  private l1Get(key: string): ChatResponse | null {
    const entry = this.l1Cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.l1Cache.delete(key);
      return null;
    }
    return entry.response;
  }

  private l1Set(key: string, response: ChatResponse): void {
    if (this.l1Cache.size >= this.L1_MAX_ENTRIES && !this.l1Cache.has(key)) {
      // Evict oldest entry (Map preserves insertion order)
      const firstKey = this.l1Cache.keys().next().value;
      if (firstKey !== undefined) this.l1Cache.delete(firstKey);
    }
    this.l1Cache.set(key, { response, expiresAt: Date.now() + this.L1_TTL_MS });
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
  async find(input: CacheLookupInput): Promise<CacheLookupResult> {
    const promptHash = this.hashPrompt(input.prompt);

    const redisKey = `aura:cache:exact:${input.projectId}:${input.provider}:${input.model}:${promptHash}:${input.parametersHash}`;

    // L1: in-process memory (0ms, no network)
    const l1Hit = this.l1Get(redisKey);
    if (l1Hit) {
      this.logger.debug(`CACHE HIT (L1 In-Process) for model ${input.model}`);
      return { hit: true, kind: 'exact', response: l1Hit };
    }

    // L2: Redis exact match (<2ms on same network)
    try {
      const cached = await this.redis.get(redisKey);
      if (cached) {
        const response = JSON.parse(cached) as ChatResponse;
        this.l1Set(redisKey, response); // warm L1 for next request
        this.logger.log(`CACHE HIT (L2 Redis Exact) for model ${input.model} in project ${input.projectId}`);
        return { hit: true, kind: 'exact', response };
      }
    } catch (e: any) {
      this.logger.warn(`Redis cache get failed: ${e.message}`);
    }

    let queryVector: number[] | undefined;

    // L3: Semantic Similarity (Needs embedding generation)
    // Only use semantic cache for shorter prompts to avoid embedding truncation
    // all-MiniLM-L6-v2 truncates at 512 tokens. If a multi-turn chat exceeds this,
    // the new message at the end is ignored, causing 100% false positive matches.
    if (input.prompt.length < 2000) {
      try {
        queryVector = await this.embeddings.generate(input.prompt);
        if (queryVector.every(v => v === 0)) {
          this.logger.warn('Embedding model not ready — skipping semantic cache operation to avoid poisoning cache');
          this.logger.log(`CACHE MISS for model ${input.model} in project ${input.projectId}`);
          return { hit: false, kind: 'miss', queryVector };
        }
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
          const similarityScore = Number(semanticHit.similarity ?? 0);
          this.logger.log(`CACHE HIT (Semantic: ${similarityScore.toFixed(4)}) for model ${input.model}`);
          this.updateHitCount(semanticHit.id);
          return {
            hit: true,
            kind: 'semantic',
            similarityScore,
            response: semanticHit.response as unknown as ChatResponse,
          };
        }
        // If no result passed the threshold, optionally log the top similarity
        // for debugging purposes when the env var CACHE_DEBUG_LOG_SIMILARITY=1
        if (process.env.CACHE_DEBUG_LOG_SIMILARITY === '1') {
          try {
            const top = await this.prisma.client.$queryRaw<any[]>`
              SELECT
                id,
                response,
                1 - (embedding <=> ${vectorString}::vector) as similarity
              FROM semantic_cache
              WHERE project_id = ${input.projectId}
                AND provider = ${input.provider}
                AND model = ${input.model}
                AND expires_at > NOW()
              ORDER BY similarity DESC
              LIMIT 1
            `;

            if (top && top.length > 0) {
              const topSim = Number(top[0].similarity ?? 0);
              this.logger.log(`Semantic top similarity (dev-debug): ${topSim.toFixed(4)} for project ${input.projectId}`);
            } else {
              this.logger.log(`Semantic debug: no candidates found for project ${input.projectId}`);
            }
          } catch (err: any) {
            this.logger.warn(`Failed to fetch top semantic similarity for debug: ${err.message}`);
          }
        }
      } catch (err: any) {
        this.logger.error(`Semantic cache lookup failed — falling through to miss: ${err.message}`, err.stack);
      }
    } else {
      this.logger.log(`Skipping Semantic Cache due to prompt length (${input.prompt.length} chars)`);
    }

    this.logger.log(`CACHE MISS for model ${input.model} in project ${input.projectId}`);
    return { hit: false, kind: 'miss', queryVector };
  }

  /**
   * Store a response in the semantic cache with its embedding vector.
   */
  async set(input: CacheLookupInput, response: ChatResponse, queryVector?: number[], ttlDays = 7): Promise<void> {
    try {
      const vector = queryVector ?? (await this.embeddings.generate(input.prompt));
      if (vector.every(v => v === 0)) {
        this.logger.warn('Embedding model not ready — skipping semantic cache operation to avoid poisoning cache');
        return;
      }
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

      const redisKey = `aura:cache:exact:${input.projectId}:${input.provider}:${input.model}:${promptHash}:${input.parametersHash}`;
      this.l1Set(redisKey, response); // warm L1 immediately
      this.redis.set(redisKey, JSON.stringify(response), 604800).catch((e: any) => this.logger.warn(`Redis cache set failed: ${e.message}`));
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
