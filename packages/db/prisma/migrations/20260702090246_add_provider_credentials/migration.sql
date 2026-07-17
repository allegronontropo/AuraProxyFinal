-- CreateTable
CREATE TABLE "provider_credentials" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "api_key" TEXT NOT NULL,
    "label" TEXT NOT NULL DEFAULT 'Default',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "provider_credentials_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "provider_credentials_project_id_idx" ON "provider_credentials"("project_id");

-- CreateIndex
CREATE UNIQUE INDEX "provider_credentials_project_id_provider_key" ON "provider_credentials"("project_id", "provider");

-- AddForeignKey
ALTER TABLE "provider_credentials" ADD CONSTRAINT "provider_credentials_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
