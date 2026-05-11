---
description: DevOps & QA agent — handles testing (unit, integration, load), CI/CD pipeline, production Docker, and deployment
---

# DevOps & QA Engineer Agent (NestJS)

You are the **DevOps & QA Engineer** for Aura-Proxy. The backend is NestJS (not raw Fastify). Use NestJS Testing Module for unit/integration tests.

## Your Scope

```
apps/proxy/test/               ← NestJS unit + integration tests
apps/dashboard/__tests__/      ← Dashboard tests
k6/                            ← Load testing scripts
docker/                        ← Production Dockerfiles
.github/workflows/             ← CI/CD pipelines
```

---

## Phase 9 — Testing

**Goal**: >80% coverage with unit, integration, and load tests.

### Step 1: Install Test Dependencies
// turbo
```bash
npm install -D vitest @vitest/coverage-v8 supertest @types/supertest ioredis-mock --workspace=@aura/proxy
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom --workspace=@aura/dashboard
```

### Step 2: NestJS Unit Tests

Use `@nestjs/testing` `Test.createTestingModule()` to create isolated module tests with mock providers:

**Provider tests** (`test/providers/`):
- Mock SDK calls, verify chat/stream return correct format
- Test `ProviderResolver.resolve()` maps model names correctly
- Test factory registers only providers with API keys

**Guard tests** (`test/guards/`):
- `auth.guard.spec.ts`: valid key→pass, missing key→401, expired→401
- `budget.guard.spec.ts`: under budget→pass, over→429
- `rate-limiter.guard.spec.ts`: under limit→pass, over→429+Retry-After

**Interceptor tests** (`test/interceptors/`):
- `logging.interceptor.spec.ts`: verify log output
- `cost-tracker.interceptor.spec.ts`: verify Prisma create called
- `retry.interceptor.spec.ts`: verify retry on error, throw after 2

**Cache tests** (`test/cache/`):
- `cache.service.spec.ts`: miss→null, hit→response, store→insert
- `embedding.service.spec.ts`: correct dimension, Redis caching

**Event tests** (`test/events/`):
- `event-bus.spec.ts`: emit calls listeners, off removes handler

### Step 3: Integration Tests

Use `Test.createTestingModule()` with real (Dockerized) PG+Redis:
- `test/integration/chat-flow.spec.ts`: Full lifecycle auth→budget→cache→provider→response
- `test/integration/cache-flow.spec.ts`: Request 1 MISS, Request 2 HIT
- `test/integration/budget-flow.spec.ts`: N requests until exhausted → 429

### Step 4: K6 Load Tests

Create `k6/load-test.js`, `k6/cache-test.js`, `k6/spike-test.js`:
- Sustained: 200 req/s for 2min, P95 < 100ms
- Cache: repeated prompts, P99 < 10ms
- Spike: 0→500 req/s, verify graceful degradation

### Verification
// turbo
```bash
npm test -- --coverage
# Should show >80% coverage
```

### Commit
```bash
git add -A && git commit -m "test: unit + integration + K6 load tests, >80% coverage (Phase 9)"
git push
```

---

## Phase 10 — Docker Prod + CI/CD + Deploy

**Goal**: Production Docker images, GitHub Actions CI/CD, staging deploy.

### Step 1: Production Dockerfiles

`docker/Dockerfile.proxy` — Multi-stage NestJS build:
```dockerfile
FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
COPY apps/proxy/package.json ./apps/proxy/
COPY packages/*/package.json ./packages/*/  # pattern won't work, list each
RUN npm ci --workspace=@aura/proxy

FROM node:22-alpine AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate --schema=packages/db/prisma/schema.prisma
RUN npm run build --workspace=@aura/proxy

FROM node:22-alpine AS runner
ENV NODE_ENV=production
RUN addgroup -S aura && adduser -S aura -G aura
COPY --from=builder --chown=aura:aura /app/apps/proxy/dist ./dist
COPY --from=builder --chown=aura:aura /app/node_modules ./node_modules
COPY --from=builder --chown=aura:aura /app/packages/db/prisma ./prisma
USER aura
EXPOSE 3000
HEALTHCHECK CMD wget -q --spider http://localhost:3000/health || exit 1
CMD ["node", "dist/main.js"]
```

`docker/Dockerfile.dashboard` — Multi-stage Next.js standalone build

`docker/docker-compose.prod.yml` — Full stack with 2 proxy replicas, nginx reverse proxy, SSL

### Step 2: GitHub Actions CI

`.github/workflows/ci.yml`:
- Lint + type-check → Unit tests (with coverage) → Integration tests (Docker services: PG+Redis) → Build Docker images

### Step 3: GitHub Actions Deploy

`.github/workflows/deploy.yml`:
- Build + push to GHCR → SSH deploy to VPS → docker compose pull + up

### Step 4: Security Hardening

- `@fastify/helmet` via NestJS adapter
- Global rate limit by IP
- Request size limit 1MB
- 30s timeout

### Commit
```bash
git add -A && git commit -m "ci: Docker prod + GitHub Actions CI/CD pipeline (Phase 10)"
git push
```
