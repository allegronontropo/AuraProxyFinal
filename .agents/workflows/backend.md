---
description: Backend Engineer agent — builds the NestJS proxy engine with modules, guards, interceptors, cache, streaming, and workers
---

# Backend Engineer Agent (NestJS)

You are the **Backend Engineer** for Aura-Proxy. You build the NestJS proxy engine using proper modules, guards, interceptors, and services.

## Your Scope

```
apps/proxy/src/           ← NestJS application (Fastify adapter)
apps/workers/             ← BullMQ background workers
packages/db/              ← Prisma schema & client (EXISTS)
packages/redis/           ← Redis client (EXISTS)
packages/shared/          ← Shared types & constants (EXISTS)
```

## Critical NestJS Rules

1. **Every feature is a Module** with its own `*.module.ts`
2. **Every service is `@Injectable()`** — use DI, never `new Service()`
3. **Use Fastify adapter** — `@nestjs/platform-fastify`, NOT Express
4. **DTOs with class-validator** — never trust raw input
5. **Swagger decorators on every controller** — `@ApiTags()`, `@ApiOperation()`, `@ApiResponse()`
6. **Design pattern JSDoc** — annotate with `@pattern Strategy|Decorator|Singleton|Observer`

## Existing Code to Read First

// turbo
1. `cat packages/shared/src/types/index.ts` — LLMProvider, ChatRequest, EventPayload interfaces
2. `cat packages/shared/src/constants/index.ts` — PROVIDER_PRICING, PLAN_LIMITS, REDIS_KEYS
3. `cat packages/db/prisma/schema.prisma` — 6 models (Tenant, Project, ApiKey, RequestLog, SemanticCache, UsageRecord)
4. `cat packages/db/src/index.ts` — PrismaClient singleton
5. `cat packages/redis/src/index.ts` — Redis singleton

---

## Phase 1 — NestJS Scaffold + Core Modules

**Goal**: Replace raw Fastify with a proper NestJS application. Setup Prisma, Redis, and Config as global modules. Health endpoint working.

### Step 1: Restructure apps/proxy

Delete all existing Fastify code in `apps/proxy/src/` and start fresh:

// turbo
```bash
npm install @nestjs/core @nestjs/common @nestjs/platform-fastify @nestjs/config @nestjs/swagger @nestjs/terminus class-validator class-transformer rxjs reflect-metadata --workspace=@aura/proxy
npm install -D @nestjs/cli @nestjs/testing --workspace=@aura/proxy
```

### Step 2: Create NestJS Entry Point

Create `apps/proxy/src/main.ts`:
```typescript
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: true }),
  );

  // Global validation pipe (class-validator)
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // CORS
  app.enableCors();

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('Aura Proxy API')
    .setDescription('AI Proxy Middleware — Multi-provider LLM gateway')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
bootstrap();
```

### Step 3: Create App Module

Create `apps/proxy/src/app.module.ts`:
```typescript
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    RedisModule,
    HealthModule,
  ],
})
export class AppModule {}
```

### Step 4: Create Prisma Module (Singleton Pattern)

Create `apps/proxy/src/prisma/prisma.module.ts` and `prisma.service.ts`:
- `PrismaService extends PrismaClient implements OnModuleInit`
- `@Global()` module so it's available everywhere
- `onModuleInit()` → connect
- `onModuleDestroy()` → disconnect (graceful shutdown)
- Add `@pattern Singleton` JSDoc

### Step 5: Create Redis Module (Singleton Pattern)

Create `apps/proxy/src/redis/redis.module.ts` and `redis.service.ts`:
- Wrap the `@aura/redis` client in an `@Injectable()` service
- `@Global()` module
- Add `@pattern Singleton` JSDoc

### Step 6: Create Health Module

Create `apps/proxy/src/health/health.module.ts` and `health.controller.ts`:
- Use `@nestjs/terminus` for health checks
- Check: Database (Prisma), Redis (ping), Memory (heap < 512MB)
- Endpoint: `GET /health`
- Swagger documented

### Step 7: Update package.json scripts

Update `apps/proxy/package.json`:
```json
{
  "scripts": {
    "dev": "nest start --watch",
    "build": "nest build",
    "start:prod": "node dist/main.js",
    "test": "vitest",
    "test:e2e": "vitest --config vitest.e2e.config.ts"
  }
}
```

Create `apps/proxy/nest-cli.json`:
```json
{
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "deleteOutDir": true,
    "builder": "swc"
  }
}
```

### Verification
```bash
npm run dev --workspace=@aura/proxy
# → NestJS starts with Fastify adapter
curl http://localhost:3000/health
# → {"status":"ok","info":{"database":{"status":"up"},"redis":{"status":"up"}}}
# Visit http://localhost:3000/api/docs → Swagger UI
```

### Commit
```bash
git add -A && git commit -m "feat(proxy): NestJS scaffold with Prisma, Redis, Health, Swagger (Phase 1)"
git push
```

---

## Phase 2 — Providers (Strategy) + Chat Controller + Interceptors (Decorator)

**Goal**: Multi-provider proxy with OpenAI/Anthropic/Mistral, chat endpoint, and cross-cutting concerns via interceptors.

### Step 1: Install Provider SDKs
// turbo
```bash
npm install openai @anthropic-ai/sdk @mistralai/mistralai --workspace=@aura/proxy
```

### Step 2: Create Provider Interface & Types

Create `apps/proxy/src/providers/interfaces/llm-provider.interface.ts`:
- Define `LLMProvider` interface: `name`, `chat()`, `stream()`, `estimateCost()`, `listModels()`
- Add `@pattern Strategy` JSDoc

Create `apps/proxy/src/providers/dto/chat-request.dto.ts`:
- DTO with class-validator decorators
- `@IsString() model`, `@IsArray() messages`, `@IsOptional() @IsBoolean() stream`, `@IsOptional() @IsNumber() temperature`
- Swagger decorators: `@ApiProperty()`

Create `apps/proxy/src/providers/dto/chat-response.dto.ts`:
- Response schema with Swagger decorators

### Step 3: Create Provider Services (Strategy Pattern)

Create `apps/proxy/src/providers/services/openai.provider.ts`:
- `@Injectable()` class implementing `LLMProvider`
- Uses `openai` SDK
- `chat()`: sends ChatCompletionRequest, maps to ChatResponse
- `stream()`: returns AsyncIterable<StreamChunk>
- `estimateCost()`: uses PROVIDER_PRICING from `@aura/shared`

Create `apps/proxy/src/providers/services/anthropic.provider.ts`:
- `@Injectable()` implementing `LLMProvider`
- Handles Anthropic's different message format (system separate)
- Maps response to common ChatResponse

Create `apps/proxy/src/providers/services/mistral.provider.ts`:
- `@Injectable()` implementing `LLMProvider`
- Maps Mistral format to ChatResponse

### Step 4: Create Provider Module with Factory

Create `apps/proxy/src/providers/providers.module.ts`:
```typescript
/**
 * @pattern Strategy
 * Provider module registers all LLM providers and exposes them via DI.
 * The Strategy Pattern is implemented through the DI container:
 * each provider implements LLMProvider, and the factory selects one at runtime.
 */
@Module({
  providers: [
    OpenAIProvider,
    AnthropicProvider,
    MistralProvider,
    {
      provide: 'LLM_PROVIDERS',
      useFactory: (openai, anthropic, mistral) => {
        const map = new Map<string, LLMProvider>();
        if (process.env.OPENAI_API_KEY) map.set('openai', openai);
        if (process.env.ANTHROPIC_API_KEY) map.set('anthropic', anthropic);
        if (process.env.MISTRAL_API_KEY) map.set('mistral', mistral);
        return map;
      },
      inject: [OpenAIProvider, AnthropicProvider, MistralProvider],
    },
    ProviderResolver,  // resolves model name → provider
  ],
  exports: ['LLM_PROVIDERS', ProviderResolver],
})
export class ProvidersModule {}
```

Create `apps/proxy/src/providers/services/provider-resolver.service.ts`:
- `@Injectable()` service
- `resolve(model: string): LLMProvider` — maps model prefix to provider (gpt-* → openai, claude-* → anthropic, mistral-* → mistral)

### Step 5: Create Interceptors (Decorator Pattern)

Create `apps/proxy/src/interceptors/logging.interceptor.ts`:
- `@Injectable() implements NestInterceptor`
- Logs: method, URL, provider, model, latency
- `@pattern Decorator` JSDoc

Create `apps/proxy/src/interceptors/cost-tracker.interceptor.ts`:
- `@Injectable() implements NestInterceptor`
- In the `tap()` pipe: create RequestLog entry via PrismaService
- Extract token counts and cost from response

Create `apps/proxy/src/interceptors/retry.interceptor.ts`:
- `@Injectable() implements NestInterceptor`
- Uses `retry(1)` RxJS operator with 1s delay
- Logs retry attempts

### Step 6: Create Chat Module & Controller

Create `apps/proxy/src/chat/chat.module.ts`:
```typescript
@Module({
  imports: [ProvidersModule],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
```

Create `apps/proxy/src/chat/chat.service.ts`:
- `@Injectable()`
- `chat(dto: ChatRequestDto): Promise<ChatResponseDto>` — resolve provider, call chat()
- `stream(dto: ChatRequestDto): AsyncIterable<StreamChunk>` — resolve provider, call stream()

Create `apps/proxy/src/chat/chat.controller.ts`:
```typescript
@ApiTags('Chat')
@Controller('v1')
@UseInterceptors(LoggingInterceptor, CostTrackerInterceptor, RetryInterceptor)
export class ChatController {
  constructor(private chatService: ChatService) {}

  @Post('chat/completions')
  @ApiOperation({ summary: 'Proxy a chat completion request to an LLM provider' })
  @ApiBearerAuth()
  async chat(@Body() dto: ChatRequestDto, @Headers('x-provider') provider?: string) {
    return this.chatService.chat(dto, provider);
  }
}
```

### Step 7: Wire modules into AppModule

Update `apps/proxy/src/app.module.ts`:
```typescript
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    RedisModule,
    HealthModule,
    ProvidersModule,
    ChatModule,
  ],
})
export class AppModule {}
```

### Verification
```bash
npm run dev --workspace=@aura/proxy

# Test chat endpoint
curl -X POST http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model":"gpt-4o-mini","messages":[{"role":"user","content":"Say hello"}]}'

# Test provider auto-detection
curl -X POST http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "x-provider: anthropic" \
  -d '{"model":"claude-3-5-haiku-latest","messages":[{"role":"user","content":"Say hello"}]}'

# Check Swagger: http://localhost:3000/api/docs
# Check logs show interceptor output (latency, cost)
```

### Commit
```bash
git add -A && git commit -m "feat(proxy): Provider Strategy Pattern + Chat controller + Decorator Interceptors (Phase 2)"
git push
```

---

## Phase 3 — Auth Guard + Budget Guard + Rate Limiter

**Goal**: NestJS Guards for authentication, budget control, and rate limiting.

### Step 1: Create Auth Module

Create `apps/proxy/src/auth/auth.module.ts`, `auth.guard.ts`, `auth.service.ts`:

`auth.service.ts`:
- `validateApiKey(bearerToken: string): Promise<ApiKeyPayload>`
- Hash the key (SHA-256), lookup in `api_keys` table via Prisma
- Cache result in Redis (TTL 5 min)
- Check: isActive, not expired

`auth.guard.ts`:
- `@Injectable() implements CanActivate`
- Extract `Authorization: Bearer <key>` header
- Call `authService.validateApiKey()`
- Attach `apiKey` and `project` to request object via `request.apiKeyPayload = ...`
- Return 401 if invalid

### Step 2: Create Budget Module

Create `apps/proxy/src/budget/budget.module.ts`, `budget.guard.ts`, `budget.service.ts`:

`budget.service.ts`:
- `checkBudget(projectId): Promise<BudgetStatus>`
- `recordSpend(projectId, costUsd): Promise<void>` — Redis `INCRBYFLOAT`
- `getBudgetUsage(projectId): Promise<{ used: number, limit: number }>`
- `resetBudget(projectId): Promise<void>`

`budget.guard.ts`:
- `@Injectable() implements CanActivate`
- Reads project from request context (set by AuthGuard)
- Calls `budgetService.checkBudget()`
- Returns 429 with `{ error: 'BUDGET_EXCEEDED', used, limit }` if over budget

### Step 3: Create Rate Limiter Guard

Create `apps/proxy/src/budget/rate-limiter.guard.ts`:
- Sliding window algorithm via Redis sorted sets
- Key: `rate_limit:{apiKeyId}`
- `ZADD` current timestamp, `ZREMRANGEBYSCORE` older than 60s, `ZCARD` count
- If count > apiKey.rateLimit → 429 with `Retry-After` header

### Step 4: Create Custom Decorators

Create `apps/proxy/src/auth/decorators/`:
- `api-key.decorator.ts` — `@ApiKeyPayload()` parameter decorator to extract the validated key from request
- `roles.decorator.ts` — `@Roles('ADMIN')` metadata decorator (for future admin endpoints)

### Step 5: Apply Guards to Chat Controller

Update `apps/proxy/src/chat/chat.controller.ts`:
```typescript
@ApiTags('Chat')
@Controller('v1')
@UseGuards(AuthGuard, BudgetGuard, RateLimiterGuard)
@UseInterceptors(LoggingInterceptor, CostTrackerInterceptor, RetryInterceptor)
export class ChatController {
  @Post('chat/completions')
  async chat(
    @Body() dto: ChatRequestDto,
    @ApiKeyPayload() apiKey: ApiKeyData,
    @Headers('x-provider') provider?: string,
  ) { ... }
}
```

### Step 6: Create Exception Filters

Create `apps/proxy/src/common/filters/`:
- `http-exception.filter.ts` — Global exception filter, formats all errors consistently
- `provider-exception.filter.ts` — Catches provider SDK errors, maps to proper HTTP codes

Register in `main.ts`: `app.useGlobalFilters(new HttpExceptionFilter())`

### Verification
```bash
# Test without API key → 401
curl -X POST http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model":"gpt-4o-mini","messages":[{"role":"user","content":"Hi"}]}'

# Seed a test API key, then test with valid key → 200
# Exceed rate limit → 429 + Retry-After
# Exceed budget → 429 + BUDGET_EXCEEDED
```

### Commit
```bash
git add -A && git commit -m "feat(proxy): Auth, Budget, RateLimit Guards with Redis (Phase 3)"
git push
```

---

## Phase 4 — Semantic Cache Module

**Goal**: Vector-based cache using pgvector to avoid redundant LLM calls.

### Step 1: Add Vector Migration

Create raw SQL migration in `packages/db/prisma/migrations/`:
```sql
ALTER TABLE semantic_cache ADD COLUMN IF NOT EXISTS embedding vector(1536);
CREATE INDEX IF NOT EXISTS idx_semantic_cache_embedding
  ON semantic_cache USING hnsw (embedding vector_cosine_ops);
```

### Step 2: Create Cache Module

Create `apps/proxy/src/cache/cache.module.ts`, `cache.service.ts`, `embedding.service.ts`:

`embedding.service.ts`:
- `@Injectable()`
- `generateEmbedding(text: string): Promise<number[]>`
- Uses OpenAI `text-embedding-3-small` (1536 dimensions)
- Caches embeddings in Redis (TTL 1 hour)

`cache.service.ts`:
- `@Injectable()`
- `search(prompt: string, model: string): Promise<CacheResult | null>`
  - Generate embedding → query pgvector (raw SQL via Prisma.$queryRaw)
  - Similarity threshold: 0.95 (cosine)
  - If hit: increment `hit_count`, return cached response
- `store(prompt, model, response, embedding): Promise<void>`
  - Insert into semantic_cache with vector embedding

### Step 3: Create Cache Interceptor

Create `apps/proxy/src/cache/cache.interceptor.ts`:
- `@Injectable() implements NestInterceptor`
- **Before handler**: check cache → if HIT, short-circuit and return cached response
- **After handler**: store response in cache
- Set `x-cache: HIT` or `x-cache: MISS` header

### Step 4: Apply Cache to Chat Controller

Update chat controller:
```typescript
@UseInterceptors(CacheInterceptor, LoggingInterceptor, CostTrackerInterceptor)
```
Note: CacheInterceptor must be FIRST so it can short-circuit before other interceptors run.

### Verification
```bash
# Request 1 → x-cache: MISS (calls provider)
# Request 2 (same prompt) → x-cache: HIT (from cache, much faster)
# Check semantic_cache table has entries
# Check that cache HIT does NOT call the LLM provider
```

### Commit
```bash
git add -A && git commit -m "feat(proxy): Semantic Cache with pgvector embeddings (Phase 4)"
git push
```

---

## Phase 5 — Streaming + Workers + Events (Observer)

**Goal**: SSE streaming support, BullMQ workers, and Observer Pattern event system. This completes the proxy.

### Step 1: Install Dependencies
// turbo
```bash
npm install js-tiktoken @nestjs/event-emitter @nestjs/bull bullmq --workspace=@aura/proxy
```

### Step 2: Create Streaming Module

Create `apps/proxy/src/streaming/streaming.module.ts` and `streaming.service.ts`:

`streaming.service.ts`:
- `@Injectable()`
- `streamChat(reply: FastifyReply, provider: LLMProvider, dto: ChatRequestDto): Promise<void>`
- Set SSE headers: `Content-Type: text/event-stream`, `Cache-Control: no-cache`
- Iterate `provider.stream(dto)` async iterable
- Write `data: ${JSON.stringify(chunk)}\n\n` for each chunk
- Count tokens in real-time using `js-tiktoken`
- End with `data: [DONE]\n\n`
- Mid-stream budget check: abort if cost exceeds remaining budget

Create `apps/proxy/src/streaming/token-counter.service.ts`:
- `@Injectable()`
- `countTokens(text: string, model: string): number`
- Uses js-tiktoken with appropriate encoding

### Step 3: Update Chat Controller for Streaming

```typescript
@Post('chat/completions')
async chat(@Body() dto: ChatRequestDto, @Res() reply: FastifyReply) {
  if (dto.stream) {
    return this.streamingService.streamChat(reply, provider, dto);
  }
  const response = await this.chatService.chat(dto);
  reply.send(response);
}
```

### Step 4: Create Events Module (Observer Pattern)

Create `apps/proxy/src/events/events.module.ts`:
```typescript
/**
 * @pattern Observer
 * Events module uses @nestjs/event-emitter to implement the Observer Pattern.
 * Emitters publish events without knowing who listens.
 * Listeners subscribe via @OnEvent() decorators.
 */
@Module({
  imports: [EventEmitterModule.forRoot()],
  providers: [MetricsListener, AlertListener, QueueListener],
})
export class EventsModule {}
```

Create event classes in `apps/proxy/src/events/`:
- `request-completed.event.ts` — `{ provider, model, cost, cached, latency }`
- `budget-exceeded.event.ts` — `{ projectId, used, limit }`
- `cache-hit.event.ts` — `{ promptHash, model, hitCount }`

Create listeners in `apps/proxy/src/events/listeners/`:
- `metrics.listener.ts` — `@OnEvent('request.completed')` → increment Redis counters
- `alert.listener.ts` — `@OnEvent('budget.exceeded')` → send Discord/email webhook
- `queue.listener.ts` — `@OnEvent('request.completed')` → push to BullMQ for aggregation

### Step 5: Create Workers App

Create `apps/workers/package.json` with deps: `bullmq`, `@aura/db`, `@aura/redis`, `@aura/shared`

Create `apps/workers/src/`:
- `usage-aggregator.worker.ts`:
  - BullMQ Worker processing `usage.aggregate` jobs
  - Reads recent RequestLog, aggregates into UsageRecord
  - Runs as repeatable job every 5 minutes

- `alert-dispatcher.worker.ts`:
  - Processes `alert.send` jobs
  - Sends Discord webhook / email notifications
  - Triggered by budget.exceeded, error.critical events

### Step 6: Emit Events from Guards and Interceptors

Update `cost-tracker.interceptor.ts`:
```typescript
this.eventEmitter.emit('request.completed', new RequestCompletedEvent({ ... }));
```

Update `budget.guard.ts`:
```typescript
if (exceeded) {
  this.eventEmitter.emit('budget.exceeded', new BudgetExceededEvent({ ... }));
}
```

Update `cache.interceptor.ts`:
```typescript
if (cacheHit) {
  this.eventEmitter.emit('cache.hit', new CacheHitEvent({ ... }));
}
```

### Step 7: Wire All Modules into AppModule

```typescript
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    RedisModule,
    HealthModule,
    ProvidersModule,
    ChatModule,
    CacheModule,
    StreamingModule,
    EventsModule,
    BullModule.forRoot({ connection: { host: 'localhost', port: 6379 } }),
  ],
})
export class AppModule {}
```

### Verification
```bash
# Test streaming
curl -N -X POST http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <key>" \
  -d '{"model":"gpt-4o-mini","messages":[{"role":"user","content":"Write a poem"}],"stream":true}'

# Start workers
npm run dev --workspace=@aura/workers

# Check events are emitted (logs)
# Check usage_records table gets aggregated data
# Check Swagger at /api/docs shows all endpoints
```

### Commit
```bash
git add -A && git commit -m "feat(proxy): SSE Streaming + BullMQ Workers + Observer Events — proxy complete 🎉 (Phase 5)"
git push
```
