import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { config as loadEnv } from 'dotenv';
import { createHash, randomUUID } from 'crypto';
import { existsSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import nock from 'nock';

type PrismaServiceShape = {
  client: any;
};

type RedisServiceShape = {
  client: {
    del: (...keys: string[]) => Promise<number>;
    scan: (cursor: string, ...args: string[]) => Promise<[string, string[]]>;
  };
};

type EmbeddingsServiceShape = {
  generate(text: string): Promise<number[]>;
};

function loadRootEnv() {
  let dir = dirname(fileURLToPath(import.meta.url));
  while (!existsSync(resolve(dir, '.env')) && dir !== resolve(dir, '..')) {
    dir = resolve(dir, '..');
  }
  if (existsSync(resolve(dir, '.env'))) {
    loadEnv({ path: resolve(dir, '.env') });
  }
}

loadRootEnv();

const e2eEnabled =
  process.env.AURA_CACHE_E2E === '1' &&
  Boolean(process.env.DATABASE_URL) &&
  Boolean(process.env.REDIS_URL) &&
  (Boolean(process.env.OPENAI_API_KEY) || process.env.MOCK_PROVIDERS === '1');

const describeE2E = e2eEnabled ? describe : describe.skip;

describeE2E('Semantic cache e2e (real providers, pgvector, Redis)', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaServiceShape;
  let redis: RedisServiceShape;
  let embeddings: EmbeddingsServiceShape;
  let projectId: string;
  let tenantId: string;
  let apiKeyId: string;
  let rawApiKey: string;
  let threshold: number;

  beforeAll(async () => {
    process.env.CACHE_SIMILARITY_THRESHOLD = process.env.AURA_CACHE_E2E_THRESHOLD ?? '0.85';
    threshold = Number(process.env.CACHE_SIMILARITY_THRESHOLD);

    if (process.env.MOCK_PROVIDERS === '1') {
      nock('https://api.openai.com')
        .persist()
        .post('/v1/chat/completions')
        .reply(200, {
          id: 'mock_chatcmpl_test',
          object: 'chat.completion',
          created: Date.now(),
          model: 'gpt-4o-mini',
          choices: [{ index: 0, message: { role: 'assistant', content: 'Mocked response' }, finish_reason: 'stop' }],
          usage: { prompt_tokens: 5, completion_tokens: 5, total_tokens: 10 }
        })
        .post('/v1/embeddings')
        .reply(200, {
          object: 'list',
          data: [{ object: 'embedding', index: 0, embedding: new Array(1536).fill(0.1) }],
          model: 'text-embedding-3-small',
          usage: { prompt_tokens: 5, total_tokens: 5 }
        });
    }

    const [{ AppModule }, { PrismaService }, { RedisService }, { EmbeddingsService }] =
      await Promise.all([
        import('../../app.module'),
        import('../../prisma/prisma.service'),
        import('../../redis/redis.service'),
        import('./embeddings.service'),
      ]);

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    prisma = app.get(PrismaService);
    redis = app.get(RedisService);
    embeddings = app.get(EmbeddingsService);

    tenantId = `tenant_cache_e2e_${randomUUID()}`;
    projectId = `project_cache_e2e_${randomUUID()}`;
    apiKeyId = `key_cache_e2e_${randomUUID()}`;
    rawApiKey = `aura_sk_cache_e2e_${randomUUID()}`;

    await prisma.client.user.create({
      data: {
        id: tenantId,
        name: 'Cache E2E Tenant',
        email: `${tenantId}@example.test`,
        password_hash: 'not-used-in-e2e',
        plan: 'FREE',
        role: 'CLIENT',
      },
    });

    await prisma.client.project.create({
      data: {
        id: projectId,
        tenantId,
        name: 'Cache E2E Project',
        budgetLimit: 100,
        budgetPeriod: 'MONTHLY',
        isActive: true,
      },
    });

    await prisma.client.apiKey.create({
      data: {
        id: apiKeyId,
        projectId,
        keyHash: createHash('sha256').update(rawApiKey).digest('hex'),
        keyPrefix: rawApiKey.slice(0, 16),
        name: 'Cache E2E Key',
        permissions: ['chat', 'completions'],
        rateLimit: 1_000,
        isActive: true,
      },
    });
  }, 120_000);

  beforeEach(async () => {
    await prisma.client.semanticCache.deleteMany({ where: { projectId } });
    await prisma.client.requestLog.deleteMany({ where: { projectId } });
    await prisma.client.usageRecord.deleteMany({ where: { projectId } });
    await redis.client.del(
      `aura:budget:${projectId}`,
      `aura:rate:${apiKeyId}`,
      `aura:key:${createHash('sha256').update(rawApiKey).digest('hex')}`,
      'aura:cache:metrics:exactHits',
      'aura:cache:metrics:semanticHits',
      'aura:cache:metrics:misses',
      'aura:cache:metrics:embeddingHits',
      'aura:cache:metrics:embeddingMisses',
      'aura:cache:metrics:exactHits:gpt-4o-mini',
      'aura:cache:metrics:semanticHits:gpt-4o-mini',
      'aura:cache:metrics:misses:gpt-4o-mini',
      'aura:cache:metrics:embeddingHits:Xenova/all-MiniLM-L6-v2',
      'aura:cache:metrics:embeddingMisses:Xenova/all-MiniLM-L6-v2',
      exactCacheKey('Explain what machine learning is.'),
      exactCacheKey('What is machine learning?'),
      exactCacheKey('Can you explain the concept of machine learning?'),
      exactCacheKey('Give me a recipe for pizza.'),
      embeddingCacheKey('Explain what machine learning is.'),
      embeddingCacheKey('What is machine learning?'),
      embeddingCacheKey('Can you explain the concept of machine learning?'),
      embeddingCacheKey('Give me a recipe for pizza.'),
    );
  });

  afterAll(async () => {
    if (process.env.MOCK_PROVIDERS === '1') {
      nock.cleanAll();
    }
    if (prisma && tenantId) {
      await prisma.client.user.delete({ where: { id: tenantId } }).catch(() => undefined);
    }
    await app?.close();
  });

  it('Test 1 - Cache Miss: calls provider, generates embedding, and inserts cache', async () => {
    const response = await chat('Explain what machine learning is.');

    expect(response.statusCode).toBe(200);
    expect(response.body.cached).toBe(false);

    await waitFor(async () => {
      const rows = await prisma.client.semanticCache.count({ where: { projectId } });
      expect(rows).toBe(1);
    });

    await waitFor(async () => {
      const providerCalls = await prisma.client.requestLog.count({ where: { projectId } });
      expect(providerCalls).toBe(1);
    });

    const stats = await cacheStats();
    expect(stats.cache.misses).toBe(1);
    expect(stats.cache.embeddingCacheMisses).toBe(1);
  }, 120_000);

  it('Test 2 - Exact Cache Hit: same prompt skips the LLM provider', async () => {
    await chat('Explain what machine learning is.');
    await waitForCacheRows(1);
    await waitForProviderCalls(1);

    const response = await chat('Explain what machine learning is.');

    expect(response.statusCode).toBe(200);
    expect(response.body.cached).toBe(true);
    await expectProviderCallsToStayAt(1);

    const stats = await cacheStats();
    expect(stats.cache.exactHits).toBe(1);
    expect(stats.cache.semanticHits).toBe(0);
    expect(stats.cache.embeddingCacheMisses).toBe(1);
  }, 120_000);

  it('Test 3 - Semantic Similarity: close prompts hit cache when score passes threshold', async () => {
    await chat('What is machine learning?');
    await waitForCacheRows(1);
    await waitForProviderCalls(1);

    const similarPrompt = 'Can you explain the concept of machine learning?';
    const similarity = await similarityToBestCachedPrompt(similarPrompt);
    const response = await chat(similarPrompt);

    console.info(`[semantic-cache:e2e] similarity=${similarity.toFixed(4)} threshold=${threshold}`);
    expect(response.statusCode).toBe(200);
    expect(response.body.cached).toBe(similarity > threshold);
    if (similarity > threshold) {
      await expectProviderCallsToStayAt(1);
      const stats = await cacheStats();
      expect(stats.cache.semanticHits).toBe(1);
    }
  }, 120_000);

  it('Test 4 - Low Similarity: unrelated prompt is a cache miss', async () => {
    await chat('What is machine learning?');
    await waitForCacheRows(1);
    await waitForProviderCalls(1);

    const unrelatedPrompt = 'Give me a recipe for pizza.';
    const similarity = await similarityToBestCachedPrompt(unrelatedPrompt);
    const response = await chat(unrelatedPrompt);

    console.info(`[semantic-cache:e2e] low_similarity=${similarity.toFixed(4)} threshold=${threshold}`);
    expect(response.statusCode).toBe(200);
    expect(response.body.cached).toBe(false);
    expect(similarity).toBeLessThanOrEqual(threshold);
    await waitForProviderCalls(2);
  }, 120_000);

  it('Test 5 - Benchmark: compares first call vs cached call', async () => {
    const first = await timedChat('Explain what machine learning is.');
    await waitForCacheRows(1);
    await waitForProviderCalls(1);

    const second = await timedChat('Explain what machine learning is.');
    await expectProviderCallsToStayAt(1);

    const cost = await prisma.client.requestLog.aggregate({
      where: { projectId },
      _sum: { costUsd: true },
    });

    const rows = [
      {
        call: 'first',
        cacheHit: first.response.body.cached,
        latencyMs: first.latencyMs,
        providerCostUsd: cost._sum.costUsd ?? 0,
      },
      {
        call: 'second',
        cacheHit: second.response.body.cached,
        latencyMs: second.latencyMs,
        providerCostUsd: 0,
      },
    ];

    console.table(rows);
    expect(first.response.body.cached).toBe(false);
    expect(second.response.body.cached).toBe(true);
  }, 120_000);

  async function cacheStats() {
    const result = await app.getHttpAdapter().getInstance().inject({
      method: 'GET',
      url: '/health/stats',
    });
    expect(result.statusCode).toBe(200);
    return JSON.parse(result.body);
  }

  async function chat(prompt: string) {
    const server = app.getHttpAdapter().getInstance();
    const result = await server.inject({
      method: 'POST',
      url: '/v1/chat/completions',
      headers: {
        authorization: `Bearer ${rawApiKey}`,
        'x-provider': 'openai',
        'content-type': 'application/json',
      },
      payload: {
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0,
        max_tokens: 64,
        top_p: 1,
      },
    });

    return {
      statusCode: result.statusCode,
      body: JSON.parse(result.body),
    };
  }

  async function timedChat(prompt: string) {
    const start = performance.now();
    const response = await chat(prompt);
    return {
      response,
      latencyMs: Math.round(performance.now() - start),
    };
  }

  async function waitForCacheRows(count: number) {
    await waitFor(async () => {
      const rows = await prisma.client.semanticCache.count({ where: { projectId } });
      expect(rows).toBe(count);
    });
  }

  async function waitForProviderCalls(count: number) {
    await waitFor(async () => {
      const rows = await prisma.client.requestLog.count({ where: { projectId } });
      expect(rows).toBe(count);
    });
  }

  async function expectProviderCallsToStayAt(count: number) {
    await new Promise((resolve) => setTimeout(resolve, 1_000));
    const rows = await prisma.client.requestLog.count({ where: { projectId } });
    expect(rows).toBe(count);
  }

  async function similarityToBestCachedPrompt(prompt: string): Promise<number> {
    const embedding = await embeddings.generate(prompt);
    const vectorString = `[${embedding.join(',')}]`;
    const rows = await prisma.client.$queryRaw<{ similarity: number }[]>`
      SELECT 1 - (embedding <=> ${vectorString}::vector) as similarity
      FROM semantic_cache
      WHERE project_id = ${projectId}
        AND provider = 'openai'
        AND model = 'gpt-4o-mini'
        AND expires_at > NOW()
      ORDER BY similarity DESC
      LIMIT 1
    `;
    return Number(rows[0]?.similarity ?? 0);
  }

  function exactCacheKey(prompt: string): string {
    const normalizedPrompt = `user: ${prompt}`.replace(/\s+/g, ' ').trim();
    const promptHash = createHash('sha256').update(normalizedPrompt).digest('hex');
    const parametersHash = createHash('sha256')
      .update(JSON.stringify({ maxTokens: 64, temperature: 0, topP: 1 }))
      .digest('hex');

    return [
      'aura:cache:exact',
      projectId,
      'openai',
      'gpt-4o-mini',
      parametersHash,
      promptHash,
    ].join(':');
  }

  function embeddingCacheKey(prompt: string): string {
    const normalizedPrompt = `user: ${prompt}`.replace(/\s+/g, ' ').trim();
    const hash = createHash('sha256').update(normalizedPrompt).digest('hex');
    return `aura:cache:embedding:Xenova/all-MiniLM-L6-v2:${hash}`;
  }
});

async function waitFor(assertion: () => Promise<void>, timeoutMs = 15_000) {
  const start = Date.now();
  let lastError: unknown;

  while (Date.now() - start < timeoutMs) {
    try {
      await assertion();
      return;
    } catch (err) {
      lastError = err;
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }

  throw lastError;
}
