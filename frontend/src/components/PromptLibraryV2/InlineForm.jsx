import { useState, useCallback, useEffect, useRef } from "react";
import {
  BookBookmark,
  ArrowLeft,
  ArrowRight,
  CircleNotch,
  CheckCircle,
  WarningCircle,
  CaretDown,
} from "@phosphor-icons/react";
import { injectVariables, validateAnswers, isQuestionVisible, parseOptions } from "./utils";

// ─── Field components (inline, with error support) ───────────────────────────

function FieldWrapper({ question, error, children }) {
  return (
    <div className="flex flex-col gap-y-1.5">
      <label className="text-sm font-medium text-white flex items-center gap-x-1.5">
        {question.label}
        {question.required && (
          <span className="text-red-400 text-xs" aria-label="required">*</span>
        )}
      </label>
      {question.placeholder && !error && (
        <p className="text-xs text-white/40 -mt-1">{question.placeholder}</p>
      )}
      {error && (
        <p className="text-xs text-red-400 flex items-center gap-x-1" role="alert">
          <WarningCircle className="h-3 w-3 shrink-0" />
          {error}
        </p>
      )}
      {children}
    </div>
  );
}

const inputBase =
  "w-full rounded-xl px-4 py-3 text-sm bg-white/5 border text-white placeholder:text-white/30 focus:outline-none focus:ring-2 transition-colors";
const inputNormal = `${inputBase} border-white/10 focus:border-white/30 focus:ring-white/10`;
const inputError = `${inputBase} border-red-400/60 focus:border-red-400 focus:ring-red-400/20`;

function TextField({ question, value, onChange, error }) {
  return (
    <FieldWrapper question={question} error={error}>
      <input
        type="text"
        value={value ?? ""}
        placeholder={question.placeholder || `Enter ${question.label.toLowerCase()}…`}
        onChange={(e) => onChange(question.variable, e.target.value)}
        className={error ? inputError : inputNormal}
        aria-invalid={!!error}
        aria-required={question.required}
      />
    </FieldWrapper>
  );
}

function TextareaField({ question, value, onChange, error }) {
  return (
    <FieldWrapper question={question} error={error}>
      <textarea
        rows={3}
        value={value ?? ""}
        placeholder={question.placeholder || `Enter ${question.label.toLowerCase()}…`}
        onChange={(e) => onChange(question.variable, e.target.value)}
        className={`${error ? inputError : inputNormal} resize-none`}
        aria-invalid={!!error}
        aria-required={question.required}
      />
    </FieldWrapper>
  );
}

function NumberField({ question, value, onChange, error }) {
  return (
    <FieldWrapper question={question} error={error}>
      <input
        type="number"
        value={value ?? ""}
        placeholder={question.placeholder || "0"}
        onChange={(e) => onChange(question.variable, e.target.value)}
        className={error ? inputError : inputNormal}
        aria-invalid={!!error}
        aria-required={question.required}
      />
    </FieldWrapper>
  );
}

function SelectField({ question, value, onChange, error }) {
  const options = parseOptions(question.options);
  return (
    <FieldWrapper question={question} error={error}>
      <div className="relative">
        <select
          value={value ?? ""}
          onChange={(e) => onChange(question.variable, e.target.value)}
          className={`${error ? inputError : inputNormal} appearance-none pr-10 cursor-pointer`}
          aria-invalid={!!error}
          aria-required={question.required}
        >
          <option value="" disabled>Select an option…</option>
          {options.map((opt) => (
            <option key={opt} value={opt} className="bg-theme-bg-secondary text-white">
              {opt}
            </option>
          ))}
        </select>
        <CaretDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40 pointer-events-none" />
      </div>
    </FieldWrapper>
  );
}

function MultiSelectField({ question, value, onChange, error }) {
  const options = parseOptions(question.options);
  const selected = value ? value.split(",").map((v) => v.trim()).filter(Boolean) : [];

  function toggle(opt) {
    const next = selected.includes(opt)
      ? selected.filter((s) => s !== opt)
      : [...selected, opt];
    onChange(question.variable, next.join(", "));
  }

  return (
    <FieldWrapper question={question} error={error}>
      <div className="flex flex-wrap gap-2" role="group" aria-label={question.label}>
        {options.map((opt) => {
          const active = selected.includes(opt);
          return (
            <button
              type="button"
              key={opt}
              onClick={() => toggle(opt)}
              aria-pressed={active}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all focus:outline-none focus:ring-2 focus:ring-white/20 ${
                active
                  ? "bg-white/15 border-white/40 text-white"
                  : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white"
              } ${error ? "border-red-400/40" : ""}`}
            >
              {opt}
            </button>
          );
        })}
      </div>
      {error && (
        <p className="text-xs text-red-400 flex items-center gap-x-1 mt-1" role="alert">
          <WarningCircle className="h-3 w-3" /> {error}
        </p>
      )}
    </FieldWrapper>
  );
}

function CheckboxField({ question, value, onChange }) {
  const checked = value === "true" || value === true;
  const id = `plv2-cb-${question.variable}`;
  return (
    <div className="flex items-start gap-x-3 py-1">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(question.variable, String(e.target.checked))}
        className="mt-0.5 w-4 h-4 rounded accent-white cursor-pointer shrink-0"
        aria-required={question.required}
      />
      <label htmlFor={id} className="text-sm text-white cursor-pointer select-none">
        {question.label}
        {question.required && <span className="text-red-400 ml-1 text-xs">*</span>}
      </label>
    </div>
  );
}

const FIELD_MAP = {
  text: TextField,
  textarea: TextareaField,
  number: NumberField,
  select: SelectField,
  multiselect: MultiSelectField,
  checkbox: CheckboxField,
};

// ─── Main InlineForm ──────────────────────────────────────────────────────────

/**
 * Production-ready inline Prompt Library form rendered inside the chat area.
 *
 * @param {{
 *   libraries: Array,
 *   loading: boolean,
 *   onGenerate: (prompt: string) => void,
 *   onClose: () => void,
 * }} props
 */
export default function InlineForm({ libraries = [], loading = false, onGenerate, onClose }) {
  const safeLibraries = Array.isArray(libraries) ? libraries : [];

  // Always start with null; auto-select when exactly one library arrives.
  const [selectedId, setSelectedId] = useState(null);
  const [answers, setAnswers] = useState({});
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // When loading completes and there is exactly one library, auto-select it.
  useEffect(() => {
    if (!loading && safeLibraries.length === 1 && selectedId === null) {
      setSelectedId(safeLibraries[0].id);
    }
  }, [loading, safeLibraries.length]);

  const selectedLib = safeLibraries.find((l) => l?.id === selectedId) ?? null;
  const questions = Array.isArray(selectedLib?.questions) ? selectedLib.questions : [];

  // Pre-fill defaults when library changes
  useEffect(() => {
    if (!selectedLib) return;
    const defaults = {};
    for (const q of questions) {
      if (q?.defaultValue != null && q.defaultValue !== "") {
        defaults[q.variable] = q.defaultValue;
      }
    }
    setAnswers(defaults);
    setErrors({});
  }, [selectedId]);

  // Inline validation: clear error for a field as soon as it gets a value
  const handleChange = useCallback((variable, value) => {
    setAnswers((prev) => ({ ...prev, [variable]: value }));
    setErrors((prev) => {
      if (!prev[variable]) return prev;
      const next = { ...prev };
      if (value && String(value).trim()) delete next[variable];
      return next;
    });
  }, []);

  // Validate visible required fields
  function validate() {
    const newErrors = {};
    for (const q of questions) {
      if (!isQuestionVisible(q, answers)) continue;
      if (!q.required) continue;
      const val = answers[q.variable];
      if (!val || !String(val).trim()) {
        newErrors[q.variable] = `${q.label} is required`;
      }
    }
    return newErrors;
  }

  async function handleGenerate() {
    if (!selectedLib) return;
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      // Scroll to first error
      const firstKey = Object.keys(newErrors)[0];
      document.getElementById(`plv2-field-${firstKey}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setSubmitting(true);
    try {
      const prompt = injectVariables(selectedLib.template ?? "", answers);
      setSuccess(true);
      await new Promise((r) => setTimeout(r, 600)); // brief success flash
      onGenerate?.(prompt);
    } catch (e) {
      console.error("[PromptLibraryV2] generate error", e);
    } finally {
      setSubmitting(false);
    }
  }

  // Keyboard: Ctrl/Cmd+Enter on Generate button
  function handleKeyDown(e) {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleGenerate();
  }

  // Loading state — shown while libraries are being fetched
  if (loading) {
    return (
      <div className="flex flex-col h-full w-full overflow-hidden bg-theme-bg-secondary">
        <TopBar onClose={onClose} />
        <div className="flex-1 flex flex-col items-center justify-center gap-y-3 text-white/40">
          <CircleNotch className="h-8 w-8 animate-spin" />
          <p className="text-sm">Loading libraries…</p>
        </div>
      </div>
    );
  }

  // Empty state — no libraries available for this workspace
  if (safeLibraries.length === 0) {
    return (
      <EmptyState onClose={onClose} />
    );
  }

  return (
    <div
      className="flex flex-col h-full w-full overflow-hidden bg-theme-bg-secondary"
      onKeyDown={handleKeyDown}
    >
      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-x-3 px-4 md:px-6 py-4 border-b border-white/10 shrink-0">
        <button
          type="button"
          onClick={onClose}
          aria-label="Back to chat"
          className="flex items-center gap-x-1.5 text-white/50 hover:text-white transition-colors text-sm focus:outline-none focus:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <div className="flex items-center gap-x-2 ml-2">
          <BookBookmark className="h-4 w-4 text-white/70" weight="fill" />
          <span className="text-sm font-semibold text-white">Prompt Library</span>
        </div>

        {/* Library selector — only show when multiple libraries */}
        {safeLibraries.length > 1 && (
          <div className="ml-auto relative">
            <select
              value={selectedId ?? ""}
              onChange={(e) => setSelectedId(Number(e.target.value) || null)}
              className="appearance-none text-sm bg-white/10 border border-white/15 text-white rounded-lg pl-3 pr-8 py-1.5 focus:outline-none focus:ring-2 focus:ring-white/20 cursor-pointer"
              aria-label="Select prompt library"
            >
              <option value="" disabled>Select a library…</option>
              {safeLibraries.map((lib) => (
                <option key={lib.id} value={lib.id} className="bg-theme-bg-secondary">
                  {lib.name ?? "Unnamed"}
                </option>
              ))}
            </select>
            <CaretDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/40 pointer-events-none" />
          </div>
        )}
      </div>

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6">
        {!selectedLib ? (
          // No library selected yet — show picker
          <LibraryPicker libraries={safeLibraries} onSelect={(id) => setSelectedId(id)} />
        ) : (
          <div className="max-w-2xl mx-auto flex flex-col gap-y-6">
            {/* Library header */}
            <div className="flex flex-col gap-y-1">
              <h2 className="text-lg font-semibold text-white">{selectedLib.name ?? ""}</h2>
              {selectedLib.description && (
                <p className="text-sm text-white/50">{selectedLib.description}</p>
              )}
            </div>

            {/* Questions */}
            {questions.length === 0 ? (
              <p className="text-sm text-white/40 italic">
                This template has no questions. Click Generate to use it directly.
              </p>
            ) : (
              <div className="flex flex-col gap-y-5">
                {questions.map((q) => {
                  if (!q?.variable) return null;
                  if (!isQuestionVisible(q, answers)) return null;
                  const Component = FIELD_MAP[q.type] ?? TextField;
                  return (
                    <div key={q.variable} id={`plv2-field-${q.variable}`}>
                      <Component
                        question={q}
                        value={answers[q.variable] ?? ""}
                        onChange={handleChange}
                        error={errors[q.variable]}
                      />
                    </div>
                  );
                })}
              </div>
            )}

            {/* Required note */}
            {questions.some((q) => q?.required) && (
              <p className="text-xs text-white/30">
                Fields marked with <span className="text-red-400">*</span> are required.
              </p>
            )}
          </div>
        )}
      </div>

      {/* ── Footer CTA ───────────────────────────────────────────────────── */}
      {selectedLib && (
        <div className="shrink-0 border-t border-white/10 px-4 md:px-6 py-4 flex items-center justify-between gap-x-4">
          <p className="text-xs text-white/30 hidden md:block">
            Tip: press <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white/50 font-mono text-[10px]">Ctrl</kbd> +{" "}
            <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white/50 font-mono text-[10px]">Enter</kbd> to generate
          </p>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={submitting || success}
            aria-label="Generate prompt"
            className={`ml-auto flex items-center gap-x-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-white/30 disabled:cursor-not-allowed ${
              success
                ? "bg-green-500/20 text-green-400 border border-green-500/30"
                : "bg-white text-black hover:bg-white/90 disabled:opacity-50"
            }`}
          >
            {success ? (
              <>
                <CheckCircle className="h-4 w-4" weight="fill" />
                Generated!
              </>
            ) : submitting ? (
              <>
                <CircleNotch className="h-4 w-4 animate-spin" />
                Generating…
              </>
            ) : (
              <>
                Generate
                <ArrowRight className="h-4 w-4" weight="bold" />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TopBar({ onClose }) {
  return (
    <div className="flex items-center gap-x-3 px-4 md:px-6 py-4 border-b border-white/10 shrink-0">
      <button
        type="button"
        onClick={onClose}
        aria-label="Back to chat"
        className="flex items-center gap-x-1.5 text-white/50 hover:text-white transition-colors text-sm focus:outline-none focus:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>
      <div className="flex items-center gap-x-2 ml-2">
        <BookBookmark className="h-4 w-4 text-white/70" weight="fill" />
        <span className="text-sm font-semibold text-white">Prompt Library</span>
      </div>
    </div>
  );
}

function LibraryPicker({ libraries, onSelect }) {
  return (
    <div className="max-w-2xl mx-auto">
      <p className="text-sm text-white/50 mb-4">Choose a template to get started:</p>
      <div className="flex flex-col gap-y-3">
        {libraries.map((lib) => (
          <button
            type="button"
            key={lib.id}
            onClick={() => onSelect(lib.id)}
            className="text-left p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all focus:outline-none focus:ring-2 focus:ring-white/20 group"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-white group-hover:text-white">
                {lib.name ?? "Unnamed"}
              </p>
              <ArrowRight className="h-4 w-4 text-white/30 group-hover:text-white/60 transition-colors" />
            </div>
            {lib.description && (
              <p className="text-xs text-white/40 mt-1">{lib.description}</p>
            )}
            {Array.isArray(lib.questions) && lib.questions.length > 0 && (
              <p className="text-[10px] text-white/25 mt-2">
                {lib.questions.length} question{lib.questions.length !== 1 ? "s" : ""}
              </p>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

function EmptyState({ onClose }) {
  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-theme-bg-secondary">
      <TopBar onClose={onClose} />
      <div className="flex-1 flex flex-col items-center justify-center gap-y-3 text-white/40">
        <BookBookmark className="h-10 w-10" weight="duotone" />
        <p className="text-sm">No prompt libraries are available for this workspace.</p>
        <button
          type="button"
          onClick={onClose}
          className="text-xs text-white/30 hover:text-white/60 underline underline-offset-2 transition-colors mt-2"
        >
          Back to chat
        </button>
      </div>
    </div>
  );
}
