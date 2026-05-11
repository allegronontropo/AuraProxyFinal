---
description: Master orchestrator — coordinates all 3 agents (Backend, Frontend, DevOps) for the Aura-Proxy NestJS build
---

# Aura-Proxy — Orchestrator (NestJS Edition)

This is the master coordination workflow. Use this to understand project status, decide which agent to invoke next, and track overall progress.

## Architecture Decision

- **Backend**: NestJS 11 with Fastify adapter (not raw Fastify)
- **Frontend**: Next.js 15 (App Router) — unchanged
- **Database**: PostgreSQL 16 + pgvector, Redis 7 — unchanged
- **Monorepo**: npm workspaces + Turborepo — unchanged

## Agent Map

| Agent | Workflow | Scope | Phases |
|---|---|---|---|
| Backend Engineer | `/backend` | `apps/proxy/`, `apps/workers/`, `packages/` | 1-5 |
| Frontend Engineer | `/frontend` | `apps/dashboard/` | 6-8 |
| DevOps & QA | `/devops` | `docker/`, `.github/`, tests, CI/CD | 9-10 |
| Agentic Lead | `/agentic` | Coordination & Collaboration Rules | Meta |

## Execution Order

```
PREREQUISITES:
  ✅ Monorepo structure exists (npm workspaces, packages/db, packages/redis, packages/shared)
  ✅ Docker Compose exists (PostgreSQL + Redis)
  ✅ Prisma schema defined (6 models, 4 enums)

BACKEND AGENT (/backend):
  ✅ Phase 1  → NestJS scaffold + Prisma/Redis modules + Health
  ✅ Phase 2  → Provider module (Strategy) + Chat controller + Interceptors (Decorator)
  Phase 3  → Auth Guard + Budget Guard + Rate Limiter
  Phase 4  → Semantic Cache module (pgvector + embeddings)
  Phase 5  → SSE Streaming + Workers (BullMQ) + Events (Observer)
             └── 🎉 PROXY IS FULLY FUNCTIONAL
```

FRONTEND AGENT (/frontend — can start after Backend Phase 2):
  Phase 6  → Auth (NextAuth RBAC) + Client/Admin layouts + shadcn/ui
  Phase 7  → API Keys CRUD + Projects + Analytics + Logs
  Phase 8  → Stripe Billing + Settings + Landing page

DEVOPS AGENT (/devops — after all features):
  Phase 9  → Tests (unit + integration + K6 load)
  Phase 10 → Docker prod + CI/CD + Swagger + Deploy
             └── 🚀 SAAS LIVE
```

## How to Use

1. Open a **new conversation**
2. Reference this project: `c:\Users\badri\Downloads\Aura Proxy`
3. Say: `Follow the /backend workflow. Execute Phase 1.`
4. After it completes with a commit, start a new conversation for Phase 2
5. Each phase ends with: verification → git commit → git push

## Rules for All Agents

1. **NestJS architecture**: Everything in the proxy is a Module. No loose files.
2. **Dependency Injection**: Never use `new Service()` — always `@Injectable()` + `@Inject()`
3. **Monorepo imports**: Use `@aura/db`, `@aura/redis`, `@aura/shared` workspace packages
4. **TypeScript strict**: No `any`, no `ts-ignore`. Use DTOs with `class-validator`.
5. **Design patterns**: Each pattern (Strategy, Decorator, Singleton, Observer) MUST have a JSDoc `@pattern` comment
6. **NestJS adapter**: Use Fastify as HTTP adapter (`@nestjs/platform-fastify`) for performance
7. **Swagger**: Every controller and DTO must have `@nestjs/swagger` decorators
8. **Git discipline**: Create a feature branch (`feat/name`) for each sub-feature, commit atomic modifications, and merge to `master`. Use conventional messages (`feat:`, `fix:`).
9. **Testing**: Every module must be testable via `@nestjs/testing` with mock providers

## Parallelization

```
Week 1-3:  Backend Phases 1-3 (sequential, dependency chain)
Week 2+:   Frontend Phase 6 can start once Phase 2 is done
Week 3-4:  Backend Phases 4-5 ║ Frontend Phase 7 (parallel)
Week 5:    Frontend Phase 8 ║ DevOps Phase 9 (parallel)
Week 6:    DevOps Phase 10 (final)
```
