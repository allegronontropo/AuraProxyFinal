-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "fallback_models" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "request_logs" ADD COLUMN     "auth_latency_ms" INTEGER,
ADD COLUMN     "cache_latency_ms" INTEGER,
ADD COLUMN     "llm_latency_ms" INTEGER;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true;
