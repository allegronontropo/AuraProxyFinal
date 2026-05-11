# Daily Planner Agent — Aura Proxy

> Agent de planification quotidienne. Chaque matin, le stagiaire demande : "Qu'est-ce que je fais aujourd'hui ?"
> L'agent calcule la semaine courante, vérifie l'avancement, et génère le plan du jour.

---

## Comment utiliser cet agent

Le stagiaire invoque `/daily` et l'agent :
1. Calcule la semaine courante (à partir du 23/04/2026)
2. Consulte le planning ci-dessous
3. Vérifie les fichiers du projet pour déterminer ce qui est déjà fait
4. Génère le plan du jour avec les tâches précises, fichiers à créer/modifier, et critères de validation

---

## Dates clés

| Événement | Date |
|---|---|
| Début du stage | 23 avril 2026 |
| Fin du stage | 22 juillet 2026 |
| Rapport de lancement | 7 mai 2026 |
| Rapport d'avancement | 4 juin 2026 |
| Rapport final | 15 juillet 2026 |

---

## Roadmap détaillée — Tâches jour par jour

### S1 — Conception (23-25 avril) ✅ TERMINÉE
- Cahier de charge technique
- Étude de l'existant (Portkey, LiteLLM, Helicone)
- Architecture NestJS (11 modules)
- Schéma BDD Prisma
- Environnement de développement

---

### S2 — Backend Fondations (28 avril - 2 mai)

**Objectif** : Scaffold NestJS + modules socle fonctionnels

#### Lundi 28/04
- [ ] Initialiser le projet NestJS dans `apps/proxy/`
  - `npx @nestjs/cli new . --package-manager npm`
  - Adapter pour Fastify : `@nestjs/platform-fastify`
  - Configurer `tsconfig.json` en CommonJS
  - Configurer `@nestjs/config` avec `.env`
- [ ] Vérifier que `npm run dev` démarre sans erreur

#### Mardi 29/04
- [ ] Créer `PrismaModule` + `PrismaService`
  - Service injectable global avec `onModuleInit()` / `onModuleDestroy()`
  - Réutiliser le singleton de `packages/db/`
- [ ] Créer `RedisModule` + `RedisService`
  - Service injectable global
  - Réutiliser le client de `packages/redis/`

#### Mercredi 30/04
- [ ] Créer `ConfigModule` centralisé
  - Validation des variables d'environnement avec `class-validator`
  - Config typée (DB, Redis, API keys LLM, Stripe)
- [ ] Créer `HealthModule` avec `@nestjs/terminus`
  - `GET /health` → statut DB + Redis
  - Health indicators personnalisés

#### Jeudi 01/05 — JOUR FÉRIÉ (Fête du Travail)

#### Vendredi 02/05
- [ ] Configurer Swagger avec `@nestjs/swagger`
  - `GET /api/docs` → Swagger UI
  - Décorateurs `@ApiTags`, `@ApiOperation`, `@ApiResponse`
- [ ] Premier commit propre
  - Branche : `feature/phase-1-scaffold`
  - Message : `feat(proxy): scaffold NestJS avec modules de base`
- [ ] Vérification complète : `npm run dev` + `/health` + `/api/docs`

**Critère de validation S2** : Le serveur NestJS démarre, `/health` retourne 200, Swagger UI est accessible.

---

### S3 — Backend Métier (5-9 mai)

**Objectif** : Providers LLM (Strategy) + ChatController + Guards

#### Lundi 05/05 ✅ TERMINÉ
- [x] Créer `ProvidersModule`
- [x] Interface `LLMProvider`
- [x] `OpenAIProvider` injectable
- [x] Migration NestJS (Phase 1) complétée
- [x] Structuration du dépôt GitHub (README, Agents)

#### Mardi 06/05
- [ ] Créer `AnthropicProvider`
- [ ] Créer `MistralProvider`
- [ ] Créer `GeminiProvider`

#### Mercredi 07/05
- [ ] Créer `ChatModule` + `ChatController`
  - `POST /v1/chat/completions` (compatible OpenAI)
  - Résolution du provider via header `x-provider` ou param
  - Injection du provider via DI
- [ ] **DEADLINE : Rapport de lancement** (7 mai)
  - Vérifier WordPress
  - Déclarer "à évaluer" sur Moodle

#### Jeudi 08/05
- [ ] Créer `AuthModule` + `AuthGuard`
  - Validation de l'API key via header `Authorization: Bearer sk-...`
  - Lookup en base (table ApiKey)
  - Injection du contexte tenant/project dans la requête
- [ ] Créer `BudgetGuard`
  - Vérification du budget restant avant chaque requête
  - Rejet 429 si budget dépassé

#### Vendredi 09/05
- [ ] Créer `RateLimiterGuard`
  - Rate limiting par API key via Redis (sliding window)
  - Headers `X-RateLimit-*` dans la réponse
- [ ] Commit + merge
  - Branche : `feature/phase-2-providers-guards`
  - Message : `feat(proxy): providers LLM + guards auth/budget/rate`

**Critère de validation S3** : `POST /v1/chat/completions` fonctionne avec les 4 providers, protégé par auth + budget + rate limit.

---

### S4 — Backend Avancé (12-16 mai)

**Objectif** : Cache sémantique + Streaming SSE + Workers

#### Lundi 12/05
- [ ] Créer `CacheModule` + `CacheService`
  - Génération d'embeddings via OpenAI `text-embedding-3-small`
  - Stockage dans PostgreSQL avec pgvector
  - Recherche par similarité cosinus (seuil > 0.95)

#### Mardi 13/05
- [ ] Créer `CacheInterceptor` (Decorator Pattern)
  - Intercepte les requêtes avant le provider
  - Si cache hit → retourne la réponse cachée
  - Si cache miss → forward au provider, puis cache la réponse

#### Mercredi 14/05
- [ ] Créer `StreamingModule` + `StreamingService`
  - Support SSE natif via NestJS (`@Sse()` decorator)
  - Comptage de tokens en temps réel pendant le streaming
  - Événements : `data`, `usage`, `done`

#### Jeudi 15/05
- [ ] Créer `EventsModule` (Observer Pattern)
  - `@nestjs/event-emitter`
  - Events : `request.completed`, `budget.exceeded`, `cache.hit`
  - Listeners pour métriques et alertes

#### Vendredi 16/05
- [ ] Créer Workers BullMQ
  - `UsageAggregator` : agrégation des stats d'usage
  - `AlertDispatcher` : envoi d'alertes budget
- [ ] Commit + merge
  - Branche : `feature/phase-3-cache-streaming`

**Critère de validation S4** : Cache sémantique réduit les appels, streaming SSE fonctionne, events émis.

---

### S5 — Frontend Auth (19-23 mai)

**Objectif** : NextAuth.js RBAC + layouts dashboard

#### Lundi 19/05
- [ ] Configurer NextAuth.js dans `apps/dashboard/`
  - Credentials provider (email + password)
  - Sessions JWT
  - Rôles : ADMIN / CLIENT

#### Mardi 20/05
- [ ] Créer les layouts dashboard
  - Sidebar avec navigation
  - Header avec avatar/logout
  - Layout différencié Admin vs Client

#### Mercredi 21/05
- [ ] Page Login / Register
  - Formulaire avec validation
  - Redirect après connexion selon le rôle

#### Jeudi 22/05
- [ ] Middleware Next.js pour protection des routes
  - Routes `/admin/*` → rôle ADMIN uniquement
  - Routes `/dashboard/*` → authentifié
  - Routes publiques : `/`, `/login`, `/register`

#### Vendredi 23/05
- [ ] Tests et commit
  - Branche : `feature/phase-4-auth`

---

### S6 — Frontend Dashboard (26-30 mai)

**Objectif** : Gestion clés API + Analytics + Logs

#### Lundi 26/05
- [ ] Page gestion des clés API
  - CRUD : créer, lister, révoquer
  - Masquage de la clé après création

#### Mardi 27/05
- [ ] Page Analytics
  - Graphiques Recharts (requêtes/jour, coûts, tokens)
  - Filtres par date, provider, projet

#### Mercredi 28/05
- [ ] Page Logs
  - Tableau des requêtes avec filtres
  - Détail d'une requête (prompt, réponse, tokens, coût, latence)

#### Jeudi 29/05
- [ ] Page Budgets
  - Vue des budgets par projet
  - Alertes visuelles si budget proche du seuil

#### Vendredi 30/05
- [ ] Tests et commit
  - Branche : `feature/phase-5-dashboard`
- [ ] **Préparer le rapport d'avancement** (deadline 4 juin)

---

### S7 — Frontend Billing (2-6 juin)

#### Lundi 02/06 — Page Stripe Checkout
#### Mardi 03/06 — Webhooks Stripe
#### Mercredi 04/06 — **DEADLINE Rapport d'avancement** + Portail client Stripe
#### Jeudi 05/06 — Page Settings utilisateur
#### Vendredi 06/06 — Commit feature/phase-6-billing

---

### S8 — Frontend Finalisation (9-13 juin)

#### Lundi 09/06 — Landing page publique
#### Mardi 10/06 — Responsive + accessibilité
#### Mercredi 11/06 — Admin : gestion tenants
#### Jeudi 12/06 — Admin : monitoring providers
#### Vendredi 13/06 — Commit feature/phase-7-frontend-final

---

### S9 — Tests (16-20 juin)

#### Lundi 16/06 — Tests unitaires backend (Vitest + NestJS Testing)
#### Mardi 17/06 — Tests unitaires frontend
#### Mercredi 18/06 — Tests d'intégration (Docker)
#### Jeudi 19/06 — Tests de charge K6
#### Vendredi 20/06 — Commit feature/phase-8-tests

---

### S10 — Déploiement (23-27 juin)

#### Lundi 23/06 — Dockerfiles production multi-stage
#### Mardi 24/06 — docker-compose.prod.yml
#### Mercredi 25/06 — CI/CD GitHub Actions (lint, tests, build)
#### Jeudi 26/06 — Documentation technique (README, CONTRIBUTING)
#### Vendredi 27/06 — Commit feature/phase-9-devops

---

### S11-S13 — Documentation et rapport final (30 juin - 22 juillet)

- Documentation technique complète
- Rapport final sur WordPress
- Préparation soutenance
- **15 juillet** : Deadline rapport final

---

## Instructions pour l'agent

Quand le stagiaire invoque `/daily` :

1. **Calculer la semaine** : `semaine = ceil((date_courante - 23/04/2026) / 7)`
2. **Identifier le jour** dans le planning ci-dessus
3. **Scanner le code** : vérifier quels fichiers/modules existent déjà
4. **Générer le plan du jour** avec :
   - 📋 Résumé de la journée (objectif principal)
   - ✅ Tâches terminées (basé sur le scan du code)
   - 🔨 Tâches du jour (avec fichiers exacts à créer/modifier)
   - ⚠️ Points d'attention (deadlines proches, blocages potentiels)
   - 📊 Progression globale (% du planning)

5. **Invoquer les agents spécialisés** si nécessaire :
   - `/backend` pour les tâches de code backend
   - `/frontend` pour les tâches de code frontend
   - `/wordpress` pour les rapports
   - `/devops` pour les tests et le déploiement

6. **Format de sortie** : tableau concis + commandes exactes à exécuter

### Règle de rattrapage

Si le stagiaire est en retard sur le planning :
- Identifier les tâches critiques (P0) vs optionnelles (P2)
- Proposer un plan de rattrapage sur 2-3 jours
- Ne JAMAIS sacrifier : Auth, Chat, Providers (core business)
- Sacrifiable si nécessaire : K6 load tests, landing page, export CSV
