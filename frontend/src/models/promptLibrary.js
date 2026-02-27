import { API_BASE } from "@/utils/constants";
import { baseHeaders } from "@/utils/request";

const PromptLibrary = {
  // ─── Admin CRUD ──────────────────────────────────────────────────

  /** Get all templates (admin) */
  getAll: async function () {
    return fetch(`${API_BASE}/admin/prompt-library`, {
      method: "GET",
      headers: baseHeaders(),
    })
      .then((res) => res.json())
      .then((res) => res?.templates || [])
      .catch((e) => {
        console.error(e);
        return [];
      });
  },

  /** Create a new template (admin) */
  create: async function (data = {}) {
    return fetch(`${API_BASE}/admin/prompt-library/new`, {
      method: "POST",
      headers: baseHeaders(),
      body: JSON.stringify(data),
    })
      .then((res) => res.json())
      .catch((e) => {
        console.error(e);
        return { template: null, error: e.message };
      });
  },

  /** Update a template (admin) */
  update: async function (id, data = {}) {
    return fetch(`${API_BASE}/admin/prompt-library/${id}`, {
      method: "POST",
      headers: baseHeaders(),
      body: JSON.stringify(data),
    })
      .then((res) => res.json())
      .catch((e) => {
        console.error(e);
        return { template: null, error: e.message };
      });
  },

  /** Delete a template (admin) */
  delete: async function (id) {
    return fetch(`${API_BASE}/admin/prompt-library/${id}`, {
      method: "DELETE",
      headers: baseHeaders(),
    })
      .then((res) => res.json())
      .then((res) => res?.success || false)
      .catch(() => false);
  },

  // ─── User-facing ────────────────────────────────────────────────

  /** Get all enabled templates (any authenticated user) */
  allEnabled: async function () {
    return fetch(`${API_BASE}/prompt-library`, {
      method: "GET",
      headers: baseHeaders(),
    })
      .then((res) => res.json())
      .then((res) => res?.templates || [])
      .catch((e) => {
        console.error(e);
        return [];
      });
  },

  /** Get the active template for a workspace */
  getActive: async function (slug) {
    return fetch(`${API_BASE}/workspace/${slug}/prompt-library/active`, {
      method: "GET",
      headers: baseHeaders(),
    })
      .then((res) => res.json())
      .then((res) => res?.template || null)
      .catch(() => null);
  },

  /** Set the active template for a workspace (templateId = null to clear) */
  setActive: async function (slug, templateId) {
    return fetch(`${API_BASE}/workspace/${slug}/prompt-library/set-active`, {
      method: "POST",
      headers: baseHeaders(),
      body: JSON.stringify({ templateId }),
    })
      .then((res) => res.json())
      .then((res) => res?.success || false)
      .catch(() => false);
  },
};

export default PromptLibrary;
