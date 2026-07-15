/*
  Warnings:

  - You are about to alter the column `embedding` on the `semantic_cache` table. The data in that column could be lost. The data in that column will be cast from `vector(1536)` to `vector(384)`.

*/
-- AlterTable
ALTER TABLE "semantic_cache" ALTER COLUMN "embedding" SET DATA TYPE vector(384);
