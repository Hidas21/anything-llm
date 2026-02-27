import SettingsSidebar from "@/components/SettingsSidebar";
import { useEffect, useState } from "react";
import { isMobile } from "react-device-detect";
import PromptLibrary from "@/models/promptLibrary";
import showToast from "@/utils/toast";
import {
  Plus,
  PencilSimple,
  Trash,
  FloppyDisk,
  X,
} from "@phosphor-icons/react";

export default function PromptLibraryAdmin() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [showNewForm, setShowNewForm] = useState(false);

  async function fetchTemplates() {
    setLoading(true);
    const data = await PromptLibrary.getAll();
    setTemplates(data);
    setLoading(false);
  }

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this template?"))
      return;
    const success = await PromptLibrary.delete(id);
    if (success) {
      showToast("Template deleted.", "success");
      fetchTemplates();
    } else {
      showToast("Failed to delete template.", "error");
    }
  };

  return (
    <div className="w-screen h-screen overflow-hidden bg-theme-bg-container flex">
      <SettingsSidebar />
      <div
        style={{ height: isMobile ? "100%" : "calc(100% - 32px)" }}
        className="relative md:ml-[2px] md:mr-[16px] md:my-[16px] md:rounded-[16px] bg-theme-bg-secondary w-full h-full overflow-y-scroll p-4 md:p-0"
      >
        <div className="flex flex-col w-full px-1 md:pl-6 md:pr-[50px] md:py-6 py-16">
          {/* Header */}
          <div className="w-full flex flex-col gap-y-1 pb-6 border-white/10 border-b-2">
            <div className="items-center flex gap-x-4">
              <p className="text-lg leading-6 font-bold text-theme-text-primary">
                Prompt Library
              </p>
            </div>
            <p className="text-xs leading-[18px] font-base text-theme-text-secondary">
              Manage reusable system prompt templates. Enabled templates will be
              available for users to select in any workspace.
            </p>
          </div>

          {/* Add new button */}
          <div className="mt-6 mb-4">
            <button
              onClick={() => {
                setShowNewForm(true);
                setEditingId(null);
              }}
              className="flex items-center gap-x-2 rounded-lg bg-primary-button hover:bg-secondary px-4 py-2 text-xs font-semibold text-white"
            >
              <Plus className="h-4 w-4" />
              New Template
            </button>
          </div>

          {/* New template form */}
          {showNewForm && (
            <TemplateForm
              onSave={async (data) => {
                const { template, error } = await PromptLibrary.create(data);
                if (template) {
                  showToast("Template created.", "success");
                  setShowNewForm(false);
                  fetchTemplates();
                } else {
                  showToast(error || "Failed to create template.", "error");
                }
              }}
              onCancel={() => setShowNewForm(false)}
            />
          )}

          {/* Templates list */}
          {loading ? (
            <p className="text-theme-text-secondary text-sm mt-4">
              Loading templates...
            </p>
          ) : templates.length === 0 && !showNewForm ? (
            <p className="text-theme-text-secondary text-sm mt-4">
              No templates yet. Create your first one above.
            </p>
          ) : (
            <div className="flex flex-col gap-y-3 mt-2">
              {templates.map((t) => (
                <TemplateRow
                  key={t.id}
                  template={t}
                  isEditing={editingId === t.id}
                  onEdit={() => {
                    setEditingId(t.id);
                    setShowNewForm(false);
                  }}
                  onCancelEdit={() => setEditingId(null)}
                  onSave={async (data) => {
                    const { template, error } = await PromptLibrary.update(
                      t.id,
                      data
                    );
                    if (template) {
                      showToast("Template updated.", "success");
                      setEditingId(null);
                      fetchTemplates();
                    } else {
                      showToast(
                        error || "Failed to update template.",
                        "error"
                      );
                    }
                  }}
                  onDelete={() => handleDelete(t.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TemplateForm({ initial = {}, onSave, onCancel }) {
  const [name, setName] = useState(initial.name || "");
  const [description, setDescription] = useState(initial.description || "");
  const [content, setContent] = useState(initial.content || "");
  const [enabled, setEnabled] = useState(
    initial.enabled !== undefined ? initial.enabled : true
  );
  const [isDefault, setIsDefault] = useState(initial.isDefault || false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !content.trim()) {
      showToast("Name and content are required.", "error");
      return;
    }
    onSave({ name: name.trim(), description: description.trim(), content: content.trim(), enabled, isDefault });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg bg-theme-bg-primary border border-white/10 p-4 mb-4"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
        <div>
          <label className="text-xs text-theme-text-secondary block mb-1">
            Name *
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Helpful Assistant"
            className="w-full bg-theme-settings-input-bg text-white text-sm rounded-lg p-2 outline-none focus:outline-primary-button"
          />
        </div>
        <div>
          <label className="text-xs text-theme-text-secondary block mb-1">
            Description
          </label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional short description"
            className="w-full bg-theme-settings-input-bg text-white text-sm rounded-lg p-2 outline-none focus:outline-primary-button"
          />
        </div>
      </div>
      <div className="mb-3">
        <label className="text-xs text-theme-text-secondary block mb-1">
          Content (System Instruction) *
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={5}
          placeholder="You are a helpful assistant..."
          className="w-full bg-theme-settings-input-bg text-white text-sm rounded-lg p-2 outline-none focus:outline-primary-button"
          style={{ resize: "vertical", minHeight: "100px" }}
        />
      </div>
      <div className="flex items-center gap-x-6 mb-4">
        <label className="flex items-center gap-x-2 text-sm text-white cursor-pointer">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="accent-primary-button"
          />
          Enabled
        </label>
        <label className="flex items-center gap-x-2 text-sm text-white cursor-pointer">
          <input
            type="checkbox"
            checked={isDefault}
            onChange={(e) => setIsDefault(e.target.checked)}
            className="accent-primary-button"
          />
          Default template
        </label>
      </div>
      <div className="flex gap-x-2">
        <button
          type="submit"
          className="flex items-center gap-x-1 rounded-lg bg-primary-button hover:bg-secondary px-4 py-2 text-xs font-semibold text-white"
        >
          <FloppyDisk className="h-4 w-4" />
          Save
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-x-1 rounded-lg bg-theme-bg-secondary hover:bg-theme-action-menu-item-hover px-4 py-2 text-xs font-semibold text-white"
        >
          <X className="h-4 w-4" />
          Cancel
        </button>
      </div>
    </form>
  );
}

function TemplateRow({
  template,
  isEditing,
  onEdit,
  onCancelEdit,
  onSave,
  onDelete,
}) {
  if (isEditing) {
    return (
      <TemplateForm initial={template} onSave={onSave} onCancel={onCancelEdit} />
    );
  }

  return (
    <div className="flex items-start justify-between rounded-lg bg-theme-bg-primary border border-white/10 p-4">
      <div className="flex-1 min-w-0 mr-4">
        <div className="flex items-center gap-x-2 mb-1">
          <p className="text-sm font-semibold text-white truncate">
            {template.name}
          </p>
          {template.isDefault && (
            <span className="text-[10px] bg-primary-button px-2 py-0.5 rounded-full text-white font-medium">
              Default
            </span>
          )}
          {!template.enabled && (
            <span className="text-[10px] bg-red-600/30 text-red-400 px-2 py-0.5 rounded-full font-medium">
              Disabled
            </span>
          )}
        </div>
        {template.description && (
          <p className="text-xs text-theme-text-secondary mb-1">
            {template.description}
          </p>
        )}
        <p className="text-xs text-white/50 line-clamp-2">{template.content}</p>
      </div>
      <div className="flex items-center gap-x-2 shrink-0">
        <button
          onClick={onEdit}
          className="p-2 rounded-lg hover:bg-theme-action-menu-item-hover text-theme-text-secondary hover:text-white"
          title="Edit"
        >
          <PencilSimple className="h-4 w-4" />
        </button>
        <button
          onClick={onDelete}
          className="p-2 rounded-lg hover:bg-red-600/20 text-theme-text-secondary hover:text-red-400"
          title="Delete"
        >
          <Trash className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
