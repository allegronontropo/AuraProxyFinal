CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TYPE "Plan" AS ENUM ('FREE', 'PRO', 'ENTERPRISE');
CREATE TYPE "Role" AS ENUM ('ADMIN', 'CLIENT');
CREATE TYPE "Period" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY');
CREATE TYPE "Granularity" AS ENUM ('HOURLY', 'DAILY', 'MONTHLY');

CREATE TABLE "tenants" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "password" TEXT NOT NULL,
  "plan" "Plan" NOT NULL DEFAULT 'FREE',
  "stripe_id" TEXT,
  "role" "Role" NOT NULL DEFAULT 'CLIENT',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "projects" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "budget_limit" DOUBLE PRECISION NOT NULL DEFAULT 100.0,
  "budget_period" "Period" NOT NULL DEFAULT 'MONTHLY',
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "api_keys" (
  "id" TEXT NOT NULL,
  "project_id" TEXT NOT NULL,
  "key_hash" TEXT NOT NULL,
  "key_prefix" TEXT NOT NULL,
  "name" TEXT NOT NULL DEFAULT 'Default Key',
  "permissions" TEXT[] DEFAULT ARRAY['chat', 'completions']::TEXT[],
  "rate_limit" INTEGER NOT NULL DEFAULT 60,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "last_used_at" TIMESTAMP(3),
  "expires_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "request_logs" (
  "id" TEXT NOT NULL,
  "api_key_id" TEXT NOT NULL,
  "project_id" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "model" TEXT NOT NULL,
  "tokens_in" INTEGER NOT NULL,
  "tokens_out" INTEGER NOT NULL,
  "cost_usd" DOUBLE PRECISION NOT NULL,
  "latency_ms" INTEGER NOT NULL,
  "status_code" INTEGER NOT NULL DEFAULT 200,
  "cached" BOOLEAN NOT NULL DEFAULT false,
  "error" TEXT,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "request_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "semantic_cache" (
  "id" TEXT NOT NULL,
  "project_id" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "prompt_hash" TEXT NOT NULL,
  "parameters_hash" TEXT NOT NULL,
  "model" TEXT NOT NULL,
  "embedding" vector(1536),
  "response" JSONB NOT NULL,
  "hit_count" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expires_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "semantic_cache_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "usage_records" (
  "id" TEXT NOT NULL,
  "project_id" TEXT NOT NULL,
  "period" TIMESTAMP(3) NOT NULL,
  "granularity" "Granularity" NOT NULL DEFAULT 'HOURLY',
  "total_requests" INTEGER NOT NULL DEFAULT 0,
  "total_tokens_in" INTEGER NOT NULL DEFAULT 0,
  "total_tokens_out" INTEGER NOT NULL DEFAULT 0,
  "total_cost_usd" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "cache_hits" INTEGER NOT NULL DEFAULT 0,
  "cache_misses" INTEGER NOT NULL DEFAULT 0,
  "avg_latency_ms" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "usage_records_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "tenants_email_key" ON "tenants"("email");
CREATE UNIQUE INDEX "tenants_stripe_id_key" ON "tenants"("stripe_id");
CREATE UNIQUE INDEX "api_keys_key_hash_key" ON "api_keys"("key_hash");
CREATE INDEX "api_keys_key_hash_idx" ON "api_keys"("key_hash");
CREATE INDEX "api_keys_key_prefix_idx" ON "api_keys"("key_prefix");
CREATE INDEX "request_logs_project_id_created_at_idx" ON "request_logs"("project_id", "created_at");
CREATE INDEX "request_logs_api_key_id_created_at_idx" ON "request_logs"("api_key_id", "created_at");
CREATE INDEX "request_logs_created_at_idx" ON "request_logs"("created_at");
CREATE UNIQUE INDEX "semantic_cache_project_id_provider_model_prompt_hash_parameters_hash_key"
  ON "semantic_cache"("project_id", "provider", "model", "prompt_hash", "parameters_hash");
CREATE INDEX "semantic_cache_project_id_provider_model_expires_at_idx"
  ON "semantic_cache"("project_id", "provider", "model", "expires_at");
CREATE INDEX "semantic_cache_prompt_hash_idx" ON "semantic_cache"("prompt_hash");
CREATE INDEX "semantic_cache_created_at_idx" ON "semantic_cache"("created_at");
CREATE INDEX "semantic_cache_embedding_hnsw_idx" ON "semantic_cache" USING hnsw ("embedding" vector_cosine_ops);
CREATE UNIQUE INDEX "usage_records_project_id_period_granularity_key" ON "usage_records"("project_id", "period", "granularity");
CREATE INDEX "usage_records_project_id_period_idx" ON "usage_records"("project_id", "period");

ALTER TABLE "projects" ADD CONSTRAINT "projects_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_project_id_fkey"
  FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "request_logs" ADD CONSTRAINT "request_logs_api_key_id_fkey"
  FOREIGN KEY ("api_key_id") REFERENCES "api_keys"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "request_logs" ADD CONSTRAINT "request_logs_project_id_fkey"
  FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "semantic_cache" ADD CONSTRAINT "semantic_cache_project_id_fkey"
  FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "usage_records" ADD CONSTRAINT "usage_records_project_id_fkey"
  FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
