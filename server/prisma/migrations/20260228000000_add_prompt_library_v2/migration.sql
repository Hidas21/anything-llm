-- CreateTable: prompt_libraries (v2, isolated from v1 prompt_library_templates)
CREATE TABLE "prompt_libraries" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "uuid" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "template" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "prompt_libraries_uuid_key" ON "prompt_libraries"("uuid");

-- CreateTable: prompt_library_questions
CREATE TABLE "prompt_library_questions" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "libraryId" INTEGER NOT NULL,
    "variable" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'text',
    "placeholder" TEXT,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "options" TEXT,
    "defaultValue" TEXT,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "showIf" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "prompt_library_questions_libraryId_fkey" FOREIGN KEY ("libraryId") REFERENCES "prompt_libraries" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "prompt_library_questions_libraryId_idx" ON "prompt_library_questions"("libraryId");

-- CreateTable: prompt_library_workspace_assignments
CREATE TABLE "prompt_library_workspace_assignments" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "libraryId" INTEGER NOT NULL,
    "workspaceId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "prompt_library_workspace_assignments_libraryId_fkey" FOREIGN KEY ("libraryId") REFERENCES "prompt_libraries" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "prompt_library_workspace_assignments_libraryId_workspaceId_key" ON "prompt_library_workspace_assignments"("libraryId", "workspaceId");
CREATE INDEX "prompt_library_workspace_assignments_workspaceId_idx" ON "prompt_library_workspace_assignments"("workspaceId");
