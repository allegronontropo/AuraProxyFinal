-- AlterTable
ALTER TABLE "semantic_cache" DROP COLUMN IF EXISTS "embedding";
ALTER TABLE "semantic_cache" ADD COLUMN "embedding" vector(1536);
