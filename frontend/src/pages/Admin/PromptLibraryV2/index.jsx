import SettingsSidebar from "@/components/SettingsSidebar";
import { useEffect, useState } from "react";
import { isMobile } from "react-device-detect";
import PromptLibraryV2 from "@/models/promptLibraryV2";
import Workspace from "@/models/workspace";
import showToast from "@/utils/toast";
import {
  Plus,
  PencilSimple,
  Trash,
  FloppyDisk,
  X,
  ArrowLeft,
  Globe,
  Buildings,
} from "@phosphor-icons/react";

// ─── Field type options ───────────────────────────────────────────────────────
const FIELD_TYPES = [
  { value: "text", label: "Short text" },
  { value: "textarea", label: "Long text" },
  { value: "number", label: "Number" },
  { value: "select", label: "Dropdown (single)" },
  { value: "multiselect", label: "Dropdown (multi)" },
  { value: "checkbox", label: "Checkbox (yes/no)" },
];

// ─── Main page ────────────────────────────────────────────────────────────────
export default function PromptLibraryV2Admin() {
  const [libraries, setLibraries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null = list view; library obj or {} = editor

  async function fetchLibraries() {
    setLoading(true);
    const data = await PromptLibraryV2.getAll();
    setLibraries(data);
    setLoading(false);
  }

  useEffect(() => {
    fetchLibraries();
  }, []);

  async function handleEdit(lib) {
    // Fetch full details (including workspaceIds) before opening editor
    if (lib.id) {
      const full = await PromptLibraryV2.getById(lib.id);
      setEditing(full ?? lib);
    } else {
      setEditing(lib);
    }
  }

  if (editing !== null) {
    return (
      <LibraryEditor
        library={editing}
        onSaved={() => { setEditing(null); fetchLibraries(); }}
        onCancel={() => setEditing(null)}
      />
    );
  }

  return (
    <div className="w-screen h-screen overflow-hidden bg-theme-bg-container flex">
      {!isMobile && <SettingsSidebar />}
      <div className="relative h-full w-full overflow-y-scroll">
        <div className="flex flex-col w-full px-1 md:pl-6 md:pr-[50px] md:py-6 py-16">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-lg font-medium text-white">Prompt Library</p>
              <p className="text-xs text-theme-text-secondary mt-1">
                Create structured prompt templates with required questions and variable injection.
              </p>
            </div>
            <button
              onClick={() => setEditing({})}
              className="flex items-center gap-x-1.5 px-3 py-2 rounded-lg bg-primary-button hover:bg-primary-button/80 text-white text-sm font-medium transition-colors"
            >
              <Plus className="h-4 w-4" />
              New Library
            </button>
          </div>

          {/* List */}
          {loading ? (
            <p className="text-sm text-theme-text-secondary">Loading…</p>
          ) : libraries.length === 0 ? (
            <div className="flex flex-col items-center gap-y-3 mt-16 opacity-60">
              <p className="text-sm text-theme-text-secondary">No libraries yet.</p>
              <button
                onClick={() => setEditing({})}
                className="text-xs px-3 py-1.5 rounded border border-white/20 text-white hover:bg-white/10"
              >
                Create your first library
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-y-3">
              {libraries.map((lib) => (
                <LibraryRow
                  key={lib.id}
                  library={lib}
                  onEdit={() => handleEdit(lib)}
                  onDelete={async () => {
                    if (!window.confirm(`Delete "${lib.name}"?`)) return;
                    const ok = await PromptLibraryV2.delete(lib.id);
                    if (ok) { showToast("Library deleted.", "success"); fetchLibraries(); }
                    else showToast("Failed to delete library.", "error");
                  }}
                  onToggle={async () => {
                    await PromptLibraryV2.update(lib.id, { enabled: !lib.enabled });
                    fetchLibraries();
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Library row ─────────────────────────────────────────────────────────────
function LibraryRow({ library, onEdit, onDelete, onToggle }) {
  // workspaceIds may not be present in list view (not fetched yet) — show generic badge
  const isGlobal = !library.workspaceIds || library.workspaceIds.length === 0;

  return (
    <div className="flex items-start gap-x-3 p-4 rounded-xl bg-theme-bg-secondary border border-white/10">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-x-2 flex-wrap gap-y-1">
          <p className="text-sm font-medium text-white truncate">{library.name}</p>
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded-full shrink-0 ${
              library.enabled
                ? "bg-green-500/20 text-green-400"
                : "bg-red-500/20 text-red-400"
            }`}
          >
            {library.enabled ? "enabled" : "disabled"}
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full shrink-0 bg-white/5 text-white/40 flex items-center gap-x-0.5">
            {isGlobal ? (
              <><Globe className="h-2.5 w-2.5" /> All workspaces</>
            ) : (
              <><Buildings className="h-2.5 w-2.5" /> {library.workspaceIds.length} workspace{library.workspaceIds.length !== 1 ? "s" : ""}</>
            )}
          </span>
        </div>
        {library.description && (
          <p className="text-xs text-theme-text-secondary mt-0.5 line-clamp-1">
            {library.description}
          </p>
        )}
        <p className="text-[10px] text-theme-text-secondary mt-1 opacity-60">
          {library.questions?.length ?? 0} question(s)
        </p>
      </div>
      <div className="flex items-center gap-x-1 shrink-0">
        <button
          onClick={onToggle}
          title={library.enabled ? "Disable" : "Enable"}
          className="p-1.5 rounded hover:bg-white/10 text-theme-text-secondary hover:text-white transition-colors text-xs"
        >
          {library.enabled ? "Disable" : "Enable"}
        </button>
        <button
          onClick={onEdit}
          className="p-1.5 rounded hover:bg-white/10 text-theme-text-secondary hover:text-white transition-colors"
        >
          <PencilSimple className="h-4 w-4" />
        </button>
        <button
          onClick={onDelete}
          className="p-1.5 rounded hover:bg-red-500/20 text-red-400 transition-colors"
        >
          <Trash className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Library editor ───────────────────────────────────────────────────────────
const EMPTY_QUESTION = () => ({
  variable: "",
  label: "",
  type: "text",
  placeholder: "",
  required: true,
  options: [],
  defaultValue: "",
  orderIndex: 0,
  showIf: null,
  _key: Math.random(),
});

function LibraryEditor({ library, onSaved, onCancel }) {
  const isNew = !library.id;
  const [saving, setSaving] = useState(false);

  // Basic fields
  const [name, setName] = useState(library.name ?? "");
  const [description, setDescription] = useState(library.description ?? "");
  const [template, setTemplate] = useState(library.template ?? "");
  const [enabled, setEnabled] = useState(library.enabled !== false);

  // Questions
  const [questions, setQuestions] = useState(
    (library.questions ?? []).map((q) => ({
      ...q,
      options: q.options ? (typeof q.options === "string" ? JSON.parse(q.options) : q.options) : [],
      showIf: q.showIf ? (typeof q.showIf === "string" ? JSON.parse(q.showIf) : q.showIf) : null,
      _key: Math.random(),
    }))
  );

  // Workspace assignment
  const [allWorkspaces, setAllWorkspaces] = useState([]);
  // assignToAll = true means no specific assignments (library visible to every workspace)
  const [assignToAll, setAssignToAll] = useState(
    !library.workspaceIds || library.workspaceIds.length === 0
  );
  const [selectedWorkspaceIds, setSelectedWorkspaceIds] = useState(
    library.workspaceIds ?? []
  );

  // Fetch all workspaces for the picker
  useEffect(() => {
    Workspace.all()
      .then((ws) => setAllWorkspaces(Array.isArray(ws) ? ws : []))
      .catch(() => setAllWorkspaces([]));
  }, []);

  function toggleWorkspace(id) {
    setSelectedWorkspaceIds((prev) =>
      prev.includes(id) ? prev.filter((w) => w !== id) : [...prev, id]
    );
  }

  function addQuestion() {
    setQuestions((prev) => [...prev, EMPTY_QUESTION()]);
  }

  function removeQuestion(idx) {
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateQuestion(idx, field, value) {
    setQuestions((prev) =>
      prev.map((q, i) => (i === idx ? { ...q, [field]: value } : q))
    );
  }

  async function handleSave() {
    if (!name.trim() || !template.trim()) {
      showToast("Name and template are required.", "error");
      return;
    }
    if (!assignToAll && selectedWorkspaceIds.length === 0) {
      showToast("Select at least one workspace, or enable 'All workspaces'.", "error");
      return;
    }
    setSaving(true);

    const payload = {
      name: name.trim(),
      description: description.trim() || null,
      template: template.trim(),
      enabled,
      questions: questions.map((q, idx) => ({
        variable: q.variable.trim(),
        label: q.label.trim(),
        type: q.type,
        placeholder: q.placeholder || null,
        required: Boolean(q.required),
        options: Array.isArray(q.options) ? q.options : [],
        defaultValue: q.defaultValue || null,
        orderIndex: idx,
        showIf: q.showIf || null,
      })),
      // Empty array = global (no specific assignments); populated array = specific workspaces
      workspaceIds: assignToAll ? [] : selectedWorkspaceIds.map(Number),
    };

    const result = isNew
      ? await PromptLibraryV2.create(payload)
      : await PromptLibraryV2.update(library.id, payload);

    setSaving(false);

    if (result?.library) {
      showToast(isNew ? "Library created!" : "Library saved!", "success");
      onSaved();
    } else {
      showToast(result?.error || "Failed to save library.", "error");
    }
  }

  return (
    <div className="w-screen h-screen overflow-hidden bg-theme-bg-container flex">
      {!isMobile && <SettingsSidebar />}
      <div className="relative h-full w-full overflow-y-scroll">
        <div className="flex flex-col w-full px-1 md:pl-6 md:pr-[50px] md:py-6 py-16 gap-y-6 max-w-3xl">
          {/* Back + title */}
          <div className="flex items-center gap-x-3">
            <button
              onClick={onCancel}
              className="p-1.5 rounded hover:bg-white/10 text-theme-text-secondary hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <p className="text-lg font-medium text-white">
              {isNew ? "New Prompt Library" : `Edit: ${library.name}`}
            </p>
          </div>

          {/* Basic info */}
          <Section title="Basic info">
            <Field label="Name *">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. LinkedIn Post Generator"
                className={INPUT_CLS}
              />
            </Field>
            <Field label="Description">
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Short description for users"
                className={INPUT_CLS}
              />
            </Field>
            <Field
              label="Template *"
              hint="Use {{variable_name}} placeholders. They will be replaced with user answers."
            >
              <textarea
                rows={6}
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
                placeholder="Write a LinkedIn post about {{topic}} targeting {{audience}}. Tone: {{tone}}."
                className={`${INPUT_CLS} resize-y font-mono text-xs`}
              />
            </Field>
            <label className="flex items-center gap-x-2 text-sm text-theme-text-primary cursor-pointer">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="w-4 h-4 accent-primary-button"
              />
              Enabled (visible to users)
            </label>
          </Section>

          {/* Workspace assignment */}
          <Section title="Workspace assignment">
            <p className="text-xs text-theme-text-secondary -mt-2">
              Control which workspaces can access this library. By default a library is visible to all workspaces.
            </p>

            <label className="flex items-center gap-x-2 text-sm text-theme-text-primary cursor-pointer">
              <input
                type="checkbox"
                checked={assignToAll}
                onChange={(e) => {
                  setAssignToAll(e.target.checked);
                  if (e.target.checked) setSelectedWorkspaceIds([]);
                }}
                className="w-4 h-4 accent-primary-button"
              />
              <Globe className="h-4 w-4 text-white/50" />
              All workspaces (global)
            </label>

            {!assignToAll && (
              <div className="flex flex-col gap-y-2 mt-1">
                <p className="text-xs text-theme-text-secondary">
                  Select one or more workspaces:
                </p>
                {allWorkspaces.length === 0 ? (
                  <p className="text-xs text-theme-text-secondary italic">
                    No workspaces found.
                  </p>
                ) : (
                  <div className="flex flex-col gap-y-1 max-h-48 overflow-y-auto rounded-lg border border-white/10 p-2">
                    {allWorkspaces.map((ws) => {
                      const checked = selectedWorkspaceIds.includes(ws.id);
                      return (
                        <label
                          key={ws.id}
                          className="flex items-center gap-x-2 text-sm text-theme-text-primary cursor-pointer px-2 py-1.5 rounded hover:bg-white/5 transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleWorkspace(ws.id)}
                            className="w-3.5 h-3.5 accent-primary-button shrink-0"
                          />
                          <span className="truncate">{ws.name}</span>
                          <span className="text-[10px] text-theme-text-secondary ml-auto shrink-0 opacity-50">
                            {ws.slug}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
                {selectedWorkspaceIds.length > 0 && (
                  <p className="text-[10px] text-white/40">
                    {selectedWorkspaceIds.length} workspace{selectedWorkspaceIds.length !== 1 ? "s" : ""} selected
                  </p>
                )}
              </div>
            )}
          </Section>

          {/* Questions */}
          <Section
            title="Questions"
            action={
              <button
                onClick={addQuestion}
                className="flex items-center gap-x-1 text-xs px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-white"
              >
                <Plus className="h-3 w-3" />
                Add question
              </button>
            }
          >
            {questions.length === 0 && (
              <p className="text-xs text-theme-text-secondary italic">
                No questions yet. Add one to collect user input.
              </p>
            )}
            {questions.map((q, idx) => (
              <QuestionEditor
                key={q._key}
                question={q}
                idx={idx}
                allVariables={questions.map((x) => x.variable).filter(Boolean)}
                onChange={(field, val) => updateQuestion(idx, field, val)}
                onRemove={() => removeQuestion(idx)}
              />
            ))}
          </Section>

          {/* Actions */}
          <div className="flex items-center gap-x-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-x-1.5 px-4 py-2 rounded-lg bg-primary-button hover:bg-primary-button/80 text-white text-sm font-medium transition-colors disabled:opacity-50"
            >
              <FloppyDisk className="h-4 w-4" />
              {saving ? "Saving…" : "Save library"}
            </button>
            <button
              onClick={onCancel}
              className="flex items-center gap-x-1.5 px-4 py-2 rounded-lg border border-white/10 hover:bg-white/10 text-white text-sm transition-colors"
            >
              <X className="h-4 w-4" />
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Question editor row ──────────────────────────────────────────────────────
function QuestionEditor({ question: q, idx, allVariables, onChange, onRemove }) {
  const needsOptions = ["select", "multiselect"].includes(q.type);

  return (
    <div className="flex flex-col gap-y-3 p-4 rounded-xl bg-theme-bg-container border border-white/10">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-theme-text-secondary">
          Question #{idx + 1}
        </span>
        <button
          onClick={onRemove}
          className="p-1 rounded hover:bg-red-500/20 text-red-400 transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Variable name *" hint="Used in {{variable}}">
          <input
            value={q.variable}
            onChange={(e) =>
              onChange("variable", e.target.value.replace(/\s+/g, "_").toLowerCase())
            }
            placeholder="topic"
            className={INPUT_CLS}
          />
        </Field>
        <Field label="Label *">
          <input
            value={q.label}
            onChange={(e) => onChange("label", e.target.value)}
            placeholder="What is the topic?"
            className={INPUT_CLS}
          />
        </Field>
        <Field label="Field type">
          <select
            value={q.type}
            onChange={(e) => onChange("type", e.target.value)}
            className={INPUT_CLS}
          >
            {FIELD_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Placeholder">
          <input
            value={q.placeholder || ""}
            onChange={(e) => onChange("placeholder", e.target.value)}
            placeholder="e.g. Enter a topic…"
            className={INPUT_CLS}
          />
        </Field>
        <Field label="Default value">
          <input
            value={q.defaultValue || ""}
            onChange={(e) => onChange("defaultValue", e.target.value)}
            className={INPUT_CLS}
          />
        </Field>
        <div className="flex items-end pb-1">
          <label className="flex items-center gap-x-2 text-xs text-theme-text-primary cursor-pointer">
            <input
              type="checkbox"
              checked={Boolean(q.required)}
              onChange={(e) => onChange("required", e.target.checked)}
              className="w-3.5 h-3.5 accent-primary-button"
            />
            Required
          </label>
        </div>
      </div>

      {/* Options (for select / multiselect) */}
      {needsOptions && (
        <Field
          label="Options (one per line)"
          hint="Each line becomes a selectable option"
        >
          <textarea
            rows={3}
            value={Array.isArray(q.options) ? q.options.join("\n") : ""}
            onChange={(e) =>
              onChange(
                "options",
                e.target.value
                  .split("\n")
                  .map((s) => s.trim())
                  .filter(Boolean)
              )
            }
            placeholder={"Professional\nCasual\nHumorous"}
            className={`${INPUT_CLS} resize-none`}
          />
        </Field>
      )}

      {/* Conditional display */}
      <details className="text-xs">
        <summary className="cursor-pointer text-theme-text-secondary hover:text-white select-none">
          Conditional display (optional)
        </summary>
        <div className="grid grid-cols-2 gap-3 mt-2">
          <Field label="Show when variable…">
            <select
              value={q.showIf?.variable || ""}
              onChange={(e) =>
                onChange("showIf", e.target.value ? { ...q.showIf, variable: e.target.value } : null)
              }
              className={INPUT_CLS}
            >
              <option value="">— always show —</option>
              {allVariables.filter((v) => v !== q.variable).map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </Field>
          <Field label="…equals">
            <input
              value={q.showIf?.equals || ""}
              onChange={(e) =>
                onChange("showIf", q.showIf?.variable ? { ...q.showIf, equals: e.target.value } : null)
              }
              placeholder="true"
              className={INPUT_CLS}
            />
          </Field>
        </div>
      </details>
    </div>
  );
}

// ─── Tiny layout helpers ──────────────────────────────────────────────────────
const INPUT_CLS =
  "w-full text-sm rounded-lg px-3 py-2 bg-theme-bg-secondary border border-white/10 text-theme-text-primary placeholder:text-theme-text-secondary focus:outline-none focus:ring-1 focus:ring-primary-button";

function Section({ title, children, action }) {
  return (
    <div className="flex flex-col gap-y-4">
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <p className="text-sm font-semibold text-white">{title}</p>
        {action}
      </div>
      {children}
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div className="flex flex-col gap-y-1">
      <label className="text-xs font-medium text-theme-text-primary">{label}</label>
      {hint && <p className="text-[10px] text-theme-text-secondary -mt-0.5">{hint}</p>}
      {children}
    </div>
  );
}
