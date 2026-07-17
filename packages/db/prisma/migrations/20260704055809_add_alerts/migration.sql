-- CreateEnum
CREATE TYPE "AlertStatus" AS ENUM ('active', 'acknowledged', 'resolved');

-- CreateEnum
CREATE TYPE "AlertSeverity" AS ENUM ('info', 'warning', 'critical');

-- CreateTable
CREATE TABLE "alerts" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "status" "AlertStatus" NOT NULL DEFAULT 'active',
    "severity" "AlertSeverity" NOT NULL DEFAULT 'info',
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alerts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "alerts_project_id_status_idx" ON "alerts"("project_id", "status");

-- CreateIndex
CREATE INDEX "alerts_created_at_idx" ON "alerts"("created_at");

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
