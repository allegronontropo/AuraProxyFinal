-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pg_trgm" WITH SCHEMA "public" VERSION "1.6";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "plpgsql" WITH SCHEMA "pg_catalog" VERSION "1.0";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector" WITH SCHEMA "public";

-- CreateEnum
CREATE TYPE "public"."Granularity" AS ENUM ('HOURLY', 'DAILY', 'MONTHLY');

-- CreateEnum
CREATE TYPE "public"."Period" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY');

-- CreateEnum
CREATE TYPE "public"."Plan" AS ENUM ('FREE', 'PRO', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('ADMIN', 'CLIENT');

-- CreateTable
CREATE TABLE "public"."accounts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_account_id" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."api_keys" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "key_hash" TEXT NOT NULL,
    "key_prefix" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Default Key',
    "permissions" TEXT[] DEFAULT ARRAY['chat:write', 'models:read']::TEXT[],
    "rate_limit" INTEGER NOT NULL DEFAULT 60,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_used_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."projects" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "budget_limit" DOUBLE PRECISION NOT NULL DEFAULT 100.0,
    "budget_period" "public"."Period" NOT NULL DEFAULT 'MONTHLY',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."request_logs" (
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

-- CreateTable
CREATE TABLE "public"."semantic_cache" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "prompt_hash" TEXT NOT NULL,
    "parameters_hash" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'openai',
    "response" JSONB NOT NULL,
    "hit_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "semantic_cache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sessions" (
    "id" TEXT NOT NULL,
    "session_token" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."usage_records" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "period" TIMESTAMP(3) NOT NULL,
    "granularity" "public"."Granularity" NOT NULL DEFAULT 'HOURLY',
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

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "email_verified" TIMESTAMP(3),
    "image" TEXT,
    "password_hash" TEXT,
    "plan" "public"."Plan" NOT NULL DEFAULT 'FREE',
    "role" "public"."Role" NOT NULL DEFAULT 'CLIENT',
    "stripe_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_provider_account_id_key" ON "public"."accounts"("provider" ASC, "provider_account_id" ASC);

-- CreateIndex
CREATE INDEX "api_keys_key_hash_idx" ON "public"."api_keys"("key_hash" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_key_hash_key" ON "public"."api_keys"("key_hash" ASC);

-- CreateIndex
CREATE INDEX "api_keys_key_prefix_idx" ON "public"."api_keys"("key_prefix" ASC);

-- CreateIndex
CREATE INDEX "request_logs_api_key_id_created_at_idx" ON "public"."request_logs"("api_key_id" ASC, "created_at" ASC);

-- CreateIndex
CREATE INDEX "request_logs_created_at_idx" ON "public"."request_logs"("created_at" ASC);

-- CreateIndex
CREATE INDEX "request_logs_project_id_created_at_idx" ON "public"."request_logs"("project_id" ASC, "created_at" ASC);

-- CreateIndex
CREATE INDEX "semantic_cache_created_at_idx" ON "public"."semantic_cache"("created_at" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "semantic_cache_project_id_model_provider_prompt_hash_parame_key" ON "public"."semantic_cache"("project_id" ASC, "model" ASC, "provider" ASC, "prompt_hash" ASC, "parameters_hash" ASC);

-- CreateIndex
CREATE INDEX "semantic_cache_prompt_hash_idx" ON "public"."semantic_cache"("prompt_hash" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "sessions_session_token_key" ON "public"."sessions"("session_token" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "usage_records_project_id_period_granularity_key" ON "public"."usage_records"("project_id" ASC, "period" ASC, "granularity" ASC);

-- CreateIndex
CREATE INDEX "usage_records_project_id_period_idx" ON "public"."usage_records"("project_id" ASC, "period" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "users_stripe_id_key" ON "public"."users"("stripe_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "public"."verification_tokens"("identifier" ASC, "token" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "public"."verification_tokens"("token" ASC);

-- AddForeignKey
ALTER TABLE "public"."accounts" ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."api_keys" ADD CONSTRAINT "api_keys_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."projects" ADD CONSTRAINT "projects_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."request_logs" ADD CONSTRAINT "request_logs_api_key_id_fkey" FOREIGN KEY ("api_key_id") REFERENCES "public"."api_keys"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."request_logs" ADD CONSTRAINT "request_logs_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."semantic_cache" ADD CONSTRAINT "semantic_cache_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."usage_records" ADD CONSTRAINT "usage_records_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

