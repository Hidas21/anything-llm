/**
 * Prompt Library V2 — isolated model layer
 * Uses Prisma raw SQL ($queryRawUnsafe / $executeRawUnsafe) to avoid needing
 * a fresh prisma generate after adding new tables.
 * Tables: prompt_libraries, prompt_library_questions, prompt_library_workspace_assignments
 */
const prisma = require("../utils/prisma");

// ─── PromptLibraryV2 ─────────────────────────────────────────────────────────

const PromptLibraryV2 = {
  /**
   * Return all libraries, optionally filtered by enabled.
   * Includes their questions ordered by orderIndex.
   */
  async where(clause = {}) {
    try {
      let whereClause = "1=1";
      const args = [];
      if (clause.enabled !== undefined) {
        args.push(clause.enabled ? 1 : 0);
        whereClause += ` AND l.enabled = ?`;
      }

      const libs = await prisma.$queryRawUnsafe(
        `SELECT * FROM prompt_libraries l WHERE ${whereClause} ORDER BY l.createdAt ASC`,
        ...args
      );

      for (const lib of libs) {
        lib.questions = await _getQuestions(lib.id);
        lib.enabled = Boolean(lib.enabled);
      }
      return libs;
    } catch (e) {
      console.error("[PromptLibraryV2.where]", e.message);
      return [];
    }
  },

  /**
   * Return a single library by id (with questions).
   */
  async get(clause = {}) {
    try {
      const libs = await prisma.$queryRawUnsafe(
        "SELECT * FROM prompt_libraries WHERE id = ? LIMIT 1",
        Number(clause.id)
      );
      if (!libs || libs.length === 0) return null;
      const lib = libs[0];
      lib.questions = await _getQuestions(lib.id);
      lib.enabled = Boolean(lib.enabled);
      return lib;
    } catch (e) {
      console.error("[PromptLibraryV2.get]", e.message);
      return null;
    }
  },

  /**
   * Return all enabled libraries accessible by a workspace.
   * "accessible" = has no workspace assignments (global) OR has an assignment for this workspace.
   */
  async forWorkspace(workspaceId) {
    try {
      const libs = await prisma.$queryRawUnsafe(
        `SELECT l.* FROM prompt_libraries l
         WHERE l.enabled = 1
         AND (
           NOT EXISTS (SELECT 1 FROM prompt_library_workspace_assignments a WHERE a.libraryId = l.id)
           OR EXISTS (SELECT 1 FROM prompt_library_workspace_assignments a WHERE a.libraryId = l.id AND a.workspaceId = ?)
         )
         ORDER BY l.createdAt ASC`,
        Number(workspaceId)
      );
      for (const lib of libs) {
        lib.questions = await _getQuestions(lib.id);
        lib.enabled = true;
      }
      return libs;
    } catch (e) {
      console.error("[PromptLibraryV2.forWorkspace]", e.message);
      return [];
    }
  },

  /**
   * Create a library along with its questions.
   */
  async create({ name, description = null, template, enabled = true, questions = [] }) {
    try {
      const uuid = _uuid();
      const now = new Date().toISOString();
      await prisma.$executeRawUnsafe(
        `INSERT INTO prompt_libraries (uuid, name, description, template, enabled, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        uuid, name, description, template, enabled ? 1 : 0, now, now
      );
      const rows = await prisma.$queryRawUnsafe(
        "SELECT * FROM prompt_libraries WHERE uuid = ? LIMIT 1",
        uuid
      );
      const lib = rows[0];
      await _replaceQuestions(lib.id, questions);
      lib.questions = await _getQuestions(lib.id);
      lib.enabled = Boolean(lib.enabled);
      return lib;
    } catch (e) {
      console.error("[PromptLibraryV2.create]", e.message);
      return null;
    }
  },

  /**
   * Update a library and optionally replace its questions.
   */
  async update(id, { name, description, template, enabled, questions } = {}) {
    try {
      const sets = [];
      const args = [];
      if (name !== undefined)        { sets.push("name = ?");        args.push(name); }
      if (description !== undefined) { sets.push("description = ?"); args.push(description); }
      if (template !== undefined)    { sets.push("template = ?");    args.push(template); }
      if (enabled !== undefined)     { sets.push("enabled = ?");     args.push(enabled ? 1 : 0); }
      sets.push("updatedAt = ?");
      args.push(new Date().toISOString());
      args.push(Number(id));

      await prisma.$executeRawUnsafe(
        `UPDATE prompt_libraries SET ${sets.join(", ")} WHERE id = ?`,
        ...args
      );

      if (Array.isArray(questions)) {
        await _replaceQuestions(Number(id), questions);
      }

      return await PromptLibraryV2.get({ id });
    } catch (e) {
      console.error("[PromptLibraryV2.update]", e.message);
      return null;
    }
  },

  /**
   * Delete a library (cascades via ON DELETE CASCADE to questions and assignments).
   */
  async delete(id) {
    try {
      // SQLite needs PRAGMA foreign_keys = ON for cascades; delete children manually to be safe
      await prisma.$executeRawUnsafe(
        "DELETE FROM prompt_library_questions WHERE libraryId = ?",
        Number(id)
      );
      await prisma.$executeRawUnsafe(
        "DELETE FROM prompt_library_workspace_assignments WHERE libraryId = ?",
        Number(id)
      );
      await prisma.$executeRawUnsafe(
        "DELETE FROM prompt_libraries WHERE id = ?",
        Number(id)
      );
      return true;
    } catch (e) {
      console.error("[PromptLibraryV2.delete]", e.message);
      return false;
    }
  },

  // ─── Workspace assignments ──────────────────────────────────────────────────

  async getAssignedWorkspaceIds(libraryId) {
    try {
      const rows = await prisma.$queryRawUnsafe(
        "SELECT workspaceId FROM prompt_library_workspace_assignments WHERE libraryId = ?",
        Number(libraryId)
      );
      return rows.map((r) => Number(r.workspaceId));
    } catch (e) {
      console.error("[PromptLibraryV2.getAssignedWorkspaceIds]", e.message);
      return [];
    }
  },

  async setWorkspaceAssignments(libraryId, workspaceIds = []) {
    try {
      await prisma.$executeRawUnsafe(
        "DELETE FROM prompt_library_workspace_assignments WHERE libraryId = ?",
        Number(libraryId)
      );
      for (const workspaceId of workspaceIds) {
        await prisma.$executeRawUnsafe(
          `INSERT OR IGNORE INTO prompt_library_workspace_assignments (libraryId, workspaceId, createdAt)
           VALUES (?, ?, ?)`,
          Number(libraryId), Number(workspaceId), new Date().toISOString()
        );
      }
      return true;
    } catch (e) {
      console.error("[PromptLibraryV2.setWorkspaceAssignments]", e.message);
      return false;
    }
  },
};

// ─── Private helpers ──────────────────────────────────────────────────────────

async function _getQuestions(libraryId) {
  const rows = await prisma.$queryRawUnsafe(
    "SELECT * FROM prompt_library_questions WHERE libraryId = ? ORDER BY orderIndex ASC",
    Number(libraryId)
  );
  return rows.map((q) => ({ ...q, required: Boolean(q.required) }));
}

async function _replaceQuestions(libraryId, questions) {
  await prisma.$executeRawUnsafe(
    "DELETE FROM prompt_library_questions WHERE libraryId = ?",
    Number(libraryId)
  );
  const now = new Date().toISOString();
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    await prisma.$executeRawUnsafe(
      `INSERT INTO prompt_library_questions
         (libraryId, variable, label, type, placeholder, required, options, defaultValue, orderIndex, showIf, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      Number(libraryId),
      q.variable || "",
      q.label || "",
      q.type || "text",
      q.placeholder || null,
      q.required !== false ? 1 : 0,
      q.options ? JSON.stringify(q.options) : null,
      q.defaultValue || null,
      q.orderIndex !== undefined ? Number(q.orderIndex) : i,
      q.showIf ? JSON.stringify(q.showIf) : null,
      now
    );
  }
}

function _uuid() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

module.exports = { PromptLibraryV2 };
