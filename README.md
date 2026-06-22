# Aura Proxy

Aura Proxy is a SaaS AI Gateway and AI Proxy service designed to act as an abstraction layer between client applications and various Large Language Models (LLMs). 

It provides centralized management for AI requests by addressing the complexity of multi-provider LLM integration and reducing the costs associated with repeated, similar prompts. 

## Features

- **Provider Abstraction**: A unified interface to connect with multiple LLM providers (OpenAI, Anthropic, Mistral, Google Gemini).
- **Exact Caching**: Fast lookup based on SHA256 prompt/parameter hashing using Redis to save costs on identical requests.
- **Semantic Caching**: AI-powered similarity search using `pgvector` to return cached results for semantically similar prompts.
- **Budget Control**: Spend tracking and budget limiting per project.
- **Rate Limiting**: Request limiting to prevent abuse and manage API quotas.
- **Authentication**: Secure API Key management with NextAuth for the dashboard.

## Tech Stack

- **Framework**: NestJS (Backend), Next.js (Dashboard frontend)
- **Language**: TypeScript
- **Database**: PostgreSQL (with pgvector), Prisma ORM
- **Cache**: Redis
- **Monorepo**: Turborepo
- **Containerization**: Docker

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/en/) (v20 or higher)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (for running Postgres and Redis containers)

### Installation

1. **Clone the repository** (or unzip the project folder).
2. **Copy the environment file**:
   ```bash
   cp .env.example .env
   ```
   *(Be sure to fill in your LLM API keys inside the `.env` file!)*

3. **Run the setup script** (Starts Docker containers, installs dependencies, and runs database migrations):
   ```bash
   npm run setup
   ```

### Running the Application

To start the development server across all packages and apps via Turborepo:
```bash
npm run dev
```

### Useful Commands

- `npm run build`: Build the project.
- `npm run test`: Run the test suite.
- `npm run lint`: Run the linters.
- `npm run db:studio`: Open Prisma Studio to view the database UI.
- `npm run docker:down`: Spin down the Docker containers.

## Architecture

Aura Proxy utilizes a monorepo structure, organizing code into `apps/` (the proxy service) and `packages/` (shared database, redis, and types). 

Requests flow through a series of Guards (Auth, Budget, RateLimit) before checking the Exact and Semantic Caches. If a cache miss occurs, the `ProvidersService` routes the request to the appropriate external LLM provider.
