/**
 * Prompt Library V2 — isolated frontend API model
 * Do NOT mix with promptLibrary.js (v1).
 */
import { API_BASE } from "@/utils/constants";
import { baseHeaders } from "@/utils/request";

const PromptLibraryV2 = {
  // ─── Admin CRUD ────────────────────────────────────────────────────────────

  /** List all libraries with questions */
  getAll: async function () {
    return fetch(`${API_BASE}/v2/admin/prompt-library`, {
      headers: baseHeaders(),
    })
      .then((r) => r.json())
      .then((r) => r?.libraries || [])
      .catch(() => []);
  },

  /** Get single library by id (includes workspaceIds) */
  getById: async function (id) {
    return fetch(`${API_BASE}/v2/admin/prompt-library/${id}`, {
      headers: baseHeaders(),
    })
      .then((r) => r.json())
      .then((r) => r?.library || null)
      .catch(() => null);
  },

  /** Create a library. data: { name, description, template, enabled, questions[], workspaceIds[] } */
  create: async function (data = {}) {
    return fetch(`${API_BASE}/v2/admin/prompt-library/new`, {
      method: "POST",
      headers: baseHeaders(),
      body: JSON.stringify(data),
    })
      .then((r) => r.json())
      .catch((e) => ({ library: null, error: e.message }));
  },

  /** Update a library by id */
  update: async function (id, data = {}) {
    return fetch(`${API_BASE}/v2/admin/prompt-library/${id}`, {
      method: "POST",
      headers: baseHeaders(),
      body: JSON.stringify(data),
    })
      .then((r) => r.json())
      .catch((e) => ({ library: null, error: e.message }));
  },

  /** Delete a library by id */
  delete: async function (id) {
    return fetch(`${API_BASE}/v2/admin/prompt-library/${id}`, {
      method: "DELETE",
      headers: baseHeaders(),
    })
      .then((r) => r.json())
      .then((r) => r?.success || false)
      .catch(() => false);
  },

  // ─── User-facing ───────────────────────────────────────────────────────────

  /** List enabled libraries accessible by a workspace */
  forWorkspace: async function (slug) {
    return fetch(`${API_BASE}/workspace/${slug}/v2/prompt-library`, {
      headers: baseHeaders(),
    })
      .then((r) => r.json())
      .then((r) => r?.libraries || [])
      .catch(() => []);
  },
};

export default PromptLibraryV2;
