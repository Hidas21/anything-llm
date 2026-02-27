import { useState, useEffect } from "react";
import { X, Check, ArrowCounterClockwise } from "@phosphor-icons/react";
import PromptLibrary from "@/models/promptLibrary";
import showToast from "@/utils/toast";

export default function PromptLibraryDrawer({
  workspace,
  activeTemplate,
  onSelect,
  onClose,
}) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTemplates() {
      setLoading(true);
      const data = await PromptLibrary.allEnabled();
      setTemplates(data);
      setLoading(false);
    }
    fetchTemplates();
  }, []);

  const handleSelect = async (template) => {
    const success = await PromptLibrary.setActive(workspace.slug, template.id);
    if (success) {
      onSelect(template);
      showToast(`Prompt template "${template.name}" activated.`, "success");
    } else {
      showToast("Failed to set active template.", "error");
    }
  };

  const handleClear = async () => {
    const success = await PromptLibrary.setActive(workspace.slug, null);
    if (success) {
      onSelect(null);
      showToast("Prompt template cleared.", "success");
    } else {
      showToast("Failed to clear template.", "error");
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />
      {/* Drawer */}
      <div className="fixed top-0 left-0 h-full w-[340px] max-w-[85vw] bg-theme-bg-sidebar border-r border-white/10 z-50 flex flex-col shadow-2xl animate-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <p className="text-sm font-bold text-white">Prompt Library</p>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-theme-action-menu-item-hover text-theme-text-secondary"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Clear selection */}
        {activeTemplate && (
          <button
            onClick={handleClear}
            className="flex items-center gap-x-2 mx-4 mt-3 px-3 py-2 rounded-lg text-xs text-white bg-red-600/20 hover:bg-red-600/30 border border-red-500/30"
          >
            <ArrowCounterClockwise className="h-4 w-4" />
            Clear selection
          </button>
        )}

        {/* Template list */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <p className="text-theme-text-secondary text-xs">Loading...</p>
          ) : templates.length === 0 ? (
            <p className="text-theme-text-secondary text-xs">
              No templates available. Ask an admin to create templates in
              Settings &gt; Prompt Library.
            </p>
          ) : (
            <div className="flex flex-col gap-y-2">
              {templates.map((t) => {
                const isActive = activeTemplate?.id === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => !isActive && handleSelect(t)}
                    className={`text-left rounded-lg p-3 border transition-all ${
                      isActive
                        ? "border-primary-button bg-primary-button/10"
                        : "border-white/10 bg-theme-bg-primary hover:border-white/30"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-white truncate">
                        {t.name}
                      </span>
                      {isActive && (
                        <Check
                          className="h-4 w-4 text-primary-button shrink-0"
                          weight="bold"
                        />
                      )}
                    </div>
                    {t.description && (
                      <p className="text-xs text-theme-text-secondary mb-1">
                        {t.description}
                      </p>
                    )}
                    <p className="text-[11px] text-white/40 line-clamp-2">
                      {t.content}
                    </p>
                    {t.isDefault && (
                      <span className="inline-block mt-1 text-[10px] bg-primary-button/30 text-primary-button px-1.5 py-0.5 rounded">
                        Default
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
