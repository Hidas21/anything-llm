const prisma = require("../utils/prisma");

const PromptLibraryTemplate = {
  /**
   * Get all templates, optionally filtered by clause.
   * @param {Object} clause - Prisma where clause
   * @param {number|null} limit - Optional limit
   * @param {Object|null} orderBy - Optional orderBy clause
   * @returns {Promise<Array>}
   */
  where: async function (clause = {}, limit = null, orderBy = null) {
    try {
      const results = await prisma.prompt_library_templates.findMany({
        where: clause,
        ...(limit !== null ? { take: limit } : {}),
        ...(orderBy !== null ? { orderBy } : { orderBy: { updatedAt: "desc" } }),
      });
      return results;
    } catch (error) {
      console.error("PromptLibraryTemplate.where", error.message);
      return [];
    }
  },

  /**
   * Get a single template by clause.
   * @param {Object} clause - Prisma where clause
   * @returns {Promise<Object|null>}
   */
  get: async function (clause = {}) {
    try {
      const template = await prisma.prompt_library_templates.findFirst({
        where: clause,
      });
      return template || null;
    } catch (error) {
      console.error("PromptLibraryTemplate.get", error.message);
      return null;
    }
  },

  /**
   * Create a new template.
   * @param {Object} data - { name, description?, content, enabled?, isDefault? }
   * @returns {Promise<Object|null>}
   */
  create: async function (data = {}) {
    try {
      // If this template is being set as default, unset any existing default
      if (data.isDefault) {
        await prisma.prompt_library_templates.updateMany({
          where: { isDefault: true },
          data: { isDefault: false },
        });
      }

      const template = await prisma.prompt_library_templates.create({
        data: {
          name: String(data.name),
          description: data.description ? String(data.description) : null,
          content: String(data.content),
          enabled: data.enabled !== undefined ? Boolean(data.enabled) : true,
          isDefault: data.isDefault !== undefined ? Boolean(data.isDefault) : false,
        },
      });
      return template;
    } catch (error) {
      console.error("PromptLibraryTemplate.create", error.message);
      return null;
    }
  },

  /**
   * Update a template by id.
   * @param {number} id - Template id
   * @param {Object} data - Fields to update
   * @returns {Promise<Object|null>}
   */
  update: async function (id, data = {}) {
    try {
      // If this template is being set as default, unset any existing default
      if (data.isDefault === true) {
        await prisma.prompt_library_templates.updateMany({
          where: { isDefault: true, id: { not: Number(id) } },
          data: { isDefault: false },
        });
      }

      const updateData = { updatedAt: new Date() };
      if (data.name !== undefined) updateData.name = String(data.name);
      if (data.description !== undefined)
        updateData.description = data.description
          ? String(data.description)
          : null;
      if (data.content !== undefined) updateData.content = String(data.content);
      if (data.enabled !== undefined) updateData.enabled = Boolean(data.enabled);
      if (data.isDefault !== undefined)
        updateData.isDefault = Boolean(data.isDefault);

      const template = await prisma.prompt_library_templates.update({
        where: { id: Number(id) },
        data: updateData,
      });
      return template;
    } catch (error) {
      console.error("PromptLibraryTemplate.update", error.message);
      return null;
    }
  },

  /**
   * Delete a template by id.
   * @param {number} id - Template id
   * @returns {Promise<boolean>}
   */
  delete: async function (id) {
    try {
      await prisma.prompt_library_templates.delete({
        where: { id: Number(id) },
      });
      return true;
    } catch (error) {
      console.error("PromptLibraryTemplate.delete", error.message);
      return false;
    }
  },

  /**
   * Get all enabled templates.
   * @returns {Promise<Array>}
   */
  allEnabled: async function () {
    return await this.where({ enabled: true });
  },

  /**
   * Get the default template (if any).
   * @returns {Promise<Object|null>}
   */
  getDefault: async function () {
    return await this.get({ isDefault: true, enabled: true });
  },
};

module.exports = { PromptLibraryTemplate };
