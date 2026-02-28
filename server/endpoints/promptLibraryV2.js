/**
 * Prompt Library V2 — isolated endpoint layer
 * All routes prefixed with /v2/prompt-library (admin) and /workspace/:slug/v2/prompt-library (user)
 */
const { PromptLibraryV2 } = require("../models/promptLibraryV2");
const { Workspace } = require("../models/workspace");
const { reqBody } = require("../utils/http");
const {
  flexUserRoleValid,
  ROLES,
} = require("../utils/middleware/multiUserProtected");
const { validatedRequest } = require("../utils/middleware/validatedRequest");
const { validWorkspaceSlug } = require("../utils/middleware/validWorkspace");

function promptLibraryV2Endpoints(app) {
  if (!app) return;

  // ─── Admin: CRUD ───────────────────────────────────────────────────────────

  // List all libraries (with questions)
  app.get(
    "/v2/admin/prompt-library",
    [validatedRequest, flexUserRoleValid([ROLES.admin])],
    async (_req, res) => {
      try {
        const libraries = await PromptLibraryV2.where({});
        res.status(200).json({ libraries });
      } catch (e) {
        console.error(e);
        res.sendStatus(500).end();
      }
    }
  );

  // Get single library (with questions + workspace assignments)
  app.get(
    "/v2/admin/prompt-library/:id",
    [validatedRequest, flexUserRoleValid([ROLES.admin])],
    async (req, res) => {
      try {
        const library = await PromptLibraryV2.get({ id: Number(req.params.id) });
        if (!library) return res.status(404).json({ error: "Not found" });
        const workspaceIds = await PromptLibraryV2.getAssignedWorkspaceIds(library.id);
        res.status(200).json({ library: { ...library, workspaceIds } });
      } catch (e) {
        console.error(e);
        res.sendStatus(500).end();
      }
    }
  );

  // Create library
  app.post(
    "/v2/admin/prompt-library/new",
    [validatedRequest, flexUserRoleValid([ROLES.admin])],
    async (req, res) => {
      try {
        const { name, description, template, enabled, questions, workspaceIds } = reqBody(req);
        if (!name || !template) {
          return res.status(400).json({ error: "name and template are required." });
        }
        const library = await PromptLibraryV2.create({ name, description, template, enabled, questions });
        if (!library) return res.status(500).json({ error: "Failed to create library." });

        if (Array.isArray(workspaceIds)) {
          await PromptLibraryV2.setWorkspaceAssignments(library.id, workspaceIds.map(Number));
        }
        res.status(200).json({ library });
      } catch (e) {
        console.error(e);
        res.sendStatus(500).end();
      }
    }
  );

  // Update library
  app.post(
    "/v2/admin/prompt-library/:id",
    [validatedRequest, flexUserRoleValid([ROLES.admin])],
    async (req, res) => {
      try {
        const id = Number(req.params.id);
        const { name, description, template, enabled, questions, workspaceIds } = reqBody(req);
        const library = await PromptLibraryV2.update(id, { name, description, template, enabled, questions });
        if (!library) return res.status(500).json({ error: "Failed to update library." });

        if (Array.isArray(workspaceIds)) {
          await PromptLibraryV2.setWorkspaceAssignments(id, workspaceIds.map(Number));
        }
        res.status(200).json({ library });
      } catch (e) {
        console.error(e);
        res.sendStatus(500).end();
      }
    }
  );

  // Delete library
  app.delete(
    "/v2/admin/prompt-library/:id",
    [validatedRequest, flexUserRoleValid([ROLES.admin])],
    async (req, res) => {
      try {
        const success = await PromptLibraryV2.delete(Number(req.params.id));
        res.status(200).json({ success });
      } catch (e) {
        console.error(e);
        res.sendStatus(500).end();
      }
    }
  );

  // ─── User-facing: list enabled libraries for a workspace ──────────────────

  app.get(
    "/workspace/:slug/v2/prompt-library",
    [validatedRequest, validWorkspaceSlug],
    async (_req, res) => {
      try {
        const { workspace } = res.locals;
        const libraries = await PromptLibraryV2.forWorkspace(workspace.id);
        // Strip workspace assignment details from user-facing response
        const safe = libraries.map(({ workspaces: _ws, ...lib }) => lib);
        res.status(200).json({ libraries: safe });
      } catch (e) {
        console.error(e);
        res.sendStatus(500).end();
      }
    }
  );
}

module.exports = { promptLibraryV2Endpoints };
