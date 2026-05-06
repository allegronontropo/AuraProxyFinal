# Aura Proxy — AI Gateway & Cost Optimization

Aura Proxy est une plateforme SaaS (AI Gateway) positionnée entre les applications clientes et les fournisseurs de LLM (OpenAI, Anthropic, Mistral, Google Gemini). Elle offre un contrôle total sur les coûts, les performances et la sécurité des appels aux modèles d'intelligence artificielle.

## 🚀 Fonctionnalités clés

- **API Unifiée** : Un seul point de terminaison (`/v1/chat/completions`) compatible avec plusieurs fournisseurs.
- **Contrôle des Coûts** : Budgets par projet, limites strictes et alertes de dépassement.
- **Cache Sémantique** : Utilisation de `pgvector` (PostgreSQL) pour mettre en cache les réponses similaires et économiser des jetons.
- **Dashboard Admin/Client** : Interface moderne pour gérer les clés API, visualiser les analytiques et gérer la facturation.
- **Streaming SSE** : Support natif du streaming pour une expérience utilisateur fluide.

## 🛠 Stack Technique

- **Monorepo** : Turborepo + npm workspaces
- **Backend** : NestJS 11 (Fastify), Prisma ORM, PostgreSQL (pgvector), Redis, BullMQ.
- **Frontend** : Next.js 15 (App Router), Tailwind CSS, shadcn/ui.
- **Infrastructure** : Docker Compose (PostgreSQL, Redis).

## 📁 Structure du Projet

```text
C:\Users\badri\Downloads\Aura Proxy\
├── apps/
│   ├── dashboard/      # Frontend Next.js (Tableau de bord)
│   └── proxy/          # Backend NestJS (Moteur de proxy)
├── packages/
│   ├── db/             # Schéma Prisma et client partagé
│   ├── redis/          # Client Redis partagé
│   └── shared/         # Types et constantes partagés
├── docker/             # Scripts d'initialisation infrastructure
└── docs/               # Documentation et rapports de stage
```

## 🚦 Démarrage Rapide

1. **Prérequis** : Node.js 20+, Docker Desktop.
2. **Installation** :
   ```bash
   npm install
   ```
3. **Infrastructure** :
   ```bash
   npm run docker:up
   ```
4. **Base de données** :
   ```bash
   npm run db:generate
   npm run db:migrate
   ```
5. **Lancement** :
   ```bash
   npm run dev
   ```

## 📄 Licence

Propriété de NewDev Maroc. Dans le cadre du stage de Badri Youssef.
