-- CreateTable
CREATE TABLE "prompt_library_templates" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "uuid" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "content" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "prompt_library_templates_uuid_key" ON "prompt_library_templates"("uuid");

-- AlterTable - add activePromptLibraryTemplateId to workspaces
ALTER TABLE "workspaces" ADD COLUMN "activePromptLibraryTemplateId" INTEGER;
