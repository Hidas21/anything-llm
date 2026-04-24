/**
 * Prompt Library V2 — model layer using Prisma ORM.
 * Works with both SQLite and PostgreSQL.
 * Tables: prompt_libraries, prompt_library_questions, prompt_library_workspace_assignments
 */
const prisma = require("../utils/prisma");

const PromptLibraryV2 = {
  async where(clause = {}) {
    try {
      const where = {};
      if (clause.enabled !== undefined) where.enabled = Boolean(clause.enabled);

      const libs = await prisma.prompt_libraries.findMany({
        where,
        orderBy: { createdAt: "asc" },
        include: {
          questions: { orderBy: { orderIndex: "asc" } },
        },
      });

      return libs.map(_formatLib);
    } catch (e) {
      console.error("[PromptLibraryV2.where]", e.message);
      return [];
    }
  },

  async get(clause = {}) {
    try {
      let lib = null;
      if (clause.id !== undefined) {
        lib = await prisma.prompt_libraries.findUnique({
          where: { id: Number(clause.id) },
          include: { questions: { orderBy: { orderIndex: "asc" } } },
        });
      } else if (clause.uuid !== undefined) {
        lib = await prisma.prompt_libraries.findUnique({
          where: { uuid: String(clause.uuid) },
          include: { questions: { orderBy: { orderIndex: "asc" } } },
        });
      } else if (clause.name !== undefined) {
        lib = await prisma.prompt_libraries.findFirst({
          where: { name: String(clause.name) },
          include: { questions: { orderBy: { orderIndex: "asc" } } },
        });
      } else {
        return null;
      }

      return lib ? _formatLib(lib) : null;
    } catch (e) {
      console.error("[PromptLibraryV2.get]", e.message);
      return null;
    }
  },

  async forWorkspace(workspaceId) {
    try {
      const libs = await prisma.prompt_libraries.findMany({
        where: {
          enabled: true,
          OR: [
            { workspaces: { none: {} } },
            { workspaces: { some: { workspaceId: Number(workspaceId) } } },
          ],
        },
        orderBy: { createdAt: "asc" },
        include: { questions: { orderBy: { orderIndex: "asc" } } },
      });

      return libs.map(_formatLib);
    } catch (e) {
      console.error("[PromptLibraryV2.forWorkspace]", e.message);
      return [];
    }
  },

  async create({ name, description = null, template, enabled = true, questions = [] }) {
    try {
      const lib = await prisma.prompt_libraries.create({
        data: {
          name,
          description,
          template,
          enabled: Boolean(enabled),
          questions: {
            create: _questionsData(questions),
          },
        },
        include: { questions: { orderBy: { orderIndex: "asc" } } },
      });

      return _formatLib(lib);
    } catch (e) {
      console.error("[PromptLibraryV2.create]", e.message);
      return null;
    }
  },

  async update(id, { name, description, template, enabled, questions } = {}) {
    try {
      const data = {};
      if (name !== undefined)        data.name = name;
      if (description !== undefined) data.description = description;
      if (template !== undefined)    data.template = template;
      if (enabled !== undefined)     data.enabled = Boolean(enabled);
      data.updatedAt = new Date();

      if (Array.isArray(questions)) {
        await prisma.prompt_library_questions.deleteMany({ where: { libraryId: Number(id) } });
        data.questions = { create: _questionsData(questions) };
      }

      const lib = await prisma.prompt_libraries.update({
        where: { id: Number(id) },
        data,
        include: { questions: { orderBy: { orderIndex: "asc" } } },
      });

      return _formatLib(lib);
    } catch (e) {
      console.error("[PromptLibraryV2.update]", e.message);
      return null;
    }
  },

  async delete(id) {
    try {
      await prisma.prompt_libraries.delete({ where: { id: Number(id) } });
      return true;
    } catch (e) {
      console.error("[PromptLibraryV2.delete]", e.message);
      return false;
    }
  },

  async getAssignedWorkspaceIds(libraryId) {
    try {
      const rows = await prisma.prompt_library_workspace_assignments.findMany({
        where: { libraryId: Number(libraryId) },
        select: { workspaceId: true },
      });
      return rows.map((r) => r.workspaceId);
    } catch (e) {
      console.error("[PromptLibraryV2.getAssignedWorkspaceIds]", e.message);
      return [];
    }
  },

  async setWorkspaceAssignments(libraryId, workspaceIds = []) {
    try {
      await prisma.prompt_library_workspace_assignments.deleteMany({
        where: { libraryId: Number(libraryId) },
      });

      if (workspaceIds.length > 0) {
        await prisma.prompt_library_workspace_assignments.createMany({
          data: workspaceIds.map((workspaceId) => ({
            libraryId: Number(libraryId),
            workspaceId: Number(workspaceId),
          })),
          skipDuplicates: true,
        });
      }

      return true;
    } catch (e) {
      console.error("[PromptLibraryV2.setWorkspaceAssignments]", e.message);
      return false;
    }
  },
};

function _formatLib(lib) {
  return {
    ...lib,
    enabled: Boolean(lib.enabled),
    questions: (lib.questions ?? []).map((q) => ({
      ...q,
      required: Boolean(q.required),
    })),
  };
}

function _questionsData(questions) {
  return questions.map((q, i) => ({
    variable:     q.variable || "",
    label:        q.label || "",
    type:         q.type || "text",
    placeholder:  q.placeholder || null,
    required:     q.required !== false,
    options:      q.options ? JSON.stringify(q.options) : null,
    defaultValue: q.defaultValue || null,
    orderIndex:   q.orderIndex !== undefined ? Number(q.orderIndex) : i,
    showIf:       q.showIf ? JSON.stringify(q.showIf) : null,
  }));
}

module.exports = { PromptLibraryV2 };
