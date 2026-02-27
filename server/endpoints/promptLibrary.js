const { PromptLibraryTemplate } = require("../models/promptLibraryTemplate");
const { Workspace } = require("../models/workspace");
const { reqBody, userFromSession } = require("../utils/http");
const {
  flexUserRoleValid,
  ROLES,
} = require("../utils/middleware/multiUserProtected");
const { validatedRequest } = require("../utils/middleware/validatedRequest");
const { validWorkspaceSlug } = require("../utils/middleware/validWorkspace");

function promptLibraryEndpoints(app) {
  if (!app) return;

  // ─── Admin CRUD ───────────────────────────────────────────────────

  // List all templates (admin)
  app.get(
    "/admin/prompt-library",
    [validatedRequest, flexUserRoleValid([ROLES.admin])],
    async (_request, response) => {
      try {
        const templates = await PromptLibraryTemplate.where({});
        response.status(200).json({ templates });
      } catch (e) {
        console.error(e);
        response.sendStatus(500).end();
      }
    }
  );

  // Create template (admin)
  app.post(
    "/admin/prompt-library/new",
    [validatedRequest, flexUserRoleValid([ROLES.admin])],
    async (request, response) => {
      try {
        const { name, description, content, enabled, isDefault } =
          reqBody(request);
        if (!name || !content) {
          response
            .status(400)
            .json({ template: null, error: "Name and content are required." });
          return;
        }

        const template = await PromptLibraryTemplate.create({
          name,
          description,
          content,
          enabled,
          isDefault,
        });

        response
          .status(200)
          .json({ template, error: template ? null : "Failed to create." });
      } catch (e) {
        console.error(e);
        response.sendStatus(500).end();
      }
    }
  );

  // Update template (admin)
  app.post(
    "/admin/prompt-library/:id",
    [validatedRequest, flexUserRoleValid([ROLES.admin])],
    async (request, response) => {
      try {
        const { id } = request.params;
        const updates = reqBody(request);
        const template = await PromptLibraryTemplate.update(
          Number(id),
          updates
        );
        response
          .status(200)
          .json({ template, error: template ? null : "Failed to update." });
      } catch (e) {
        console.error(e);
        response.sendStatus(500).end();
      }
    }
  );

  // Delete template (admin)
  app.delete(
    "/admin/prompt-library/:id",
    [validatedRequest, flexUserRoleValid([ROLES.admin])],
    async (request, response) => {
      try {
        const { id } = request.params;
        const success = await PromptLibraryTemplate.delete(Number(id));
        response.status(200).json({ success });
      } catch (e) {
        console.error(e);
        response.sendStatus(500).end();
      }
    }
  );

  // ─── User-facing: list enabled templates ──────────────────────────

  app.get(
    "/prompt-library",
    [validatedRequest, flexUserRoleValid([ROLES.all])],
    async (_request, response) => {
      try {
        const templates = await PromptLibraryTemplate.allEnabled();
        response.status(200).json({ templates });
      } catch (e) {
        console.error(e);
        response.sendStatus(500).end();
      }
    }
  );

  // ─── Per-workspace active template ────────────────────────────────

  // Get active template for a workspace
  app.get(
    "/workspace/:slug/prompt-library/active",
    [validatedRequest, validWorkspaceSlug],
    async (request, response) => {
      try {
        const { workspace } = response.locals;
        let template = null;

        if (workspace.activePromptLibraryTemplateId) {
          template = await PromptLibraryTemplate.get({
            id: workspace.activePromptLibraryTemplateId,
            enabled: true,
          });
        }

        // Fall back to default template if the active one was disabled/deleted
        if (!template) {
          template = await PromptLibraryTemplate.getDefault();
        }

        response.status(200).json({ template });
      } catch (e) {
        console.error(e);
        response.sendStatus(500).end();
      }
    }
  );

  // Set active template for a workspace
  app.post(
    "/workspace/:slug/prompt-library/set-active",
    [validatedRequest, validWorkspaceSlug],
    async (request, response) => {
      try {
        const { workspace } = response.locals;
        const { templateId } = reqBody(request);

        // templateId = null means "clear selection"
        await Workspace._update(workspace.id, {
          activePromptLibraryTemplateId:
            templateId !== null && templateId !== undefined
              ? Number(templateId)
              : null,
        });

        response.status(200).json({ success: true });
      } catch (e) {
        console.error(e);
        response.sendStatus(500).end();
      }
    }
  );
}

module.exports = { promptLibraryEndpoints };
