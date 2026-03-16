import { useState, useCallback, useEffect } from "react";
import {
  BookBookmark,
  ArrowLeft,
  ArrowRight,
  CircleNotch,
  CheckCircle,
  WarningCircle,
  CaretDown,
} from "@phosphor-icons/react";
import { injectVariables, isQuestionVisible, parseOptions } from "./utils";

// ─── Field components (inline, with error support) ───────────────────────────

function FieldWrapper({ question, error, children }) {
  return (
    <div className="flex flex-col gap-y-1.5">
      <label className="text-sm font-medium text-theme-text-primary flex items-center gap-x-1.5">
        {question.label}
        {question.required && (
          <span className="text-red-400 text-xs" aria-label="required">*</span>
        )}
      </label>
      {question.placeholder && !error && (
        <p className="text-xs text-theme-text-secondary -mt-1">{question.placeholder}</p>
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
  "plv2-input w-full rounded-xl px-4 py-3 text-sm transition-colors focus:outline-none";
const inputNormal = inputBase;
const inputError = `${inputBase} border-red-400/70 focus:border-red-400`;

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
            <option key={opt} value={opt} className="bg-theme-bg-secondary text-theme-text-primary">
              {opt}
            </option>
          ))}
        </select>
        <CaretDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-theme-text-secondary pointer-events-none" />
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
              className={`plv2-chip px-3 py-1.5 rounded-lg text-sm font-medium border transition-all focus:outline-none ${
                active
                  ? "plv2-chip-active"
                  : ""
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
        className="mt-0.5 w-4 h-4 rounded accent-[var(--theme-button-primary)] cursor-pointer shrink-0"
        aria-required={question.required}
      />
      <label htmlFor={id} className="text-sm text-theme-text-primary cursor-pointer select-none">
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

function hasAnswer(value) {
  if (value === undefined || value === null) return false;
  return String(value).trim() !== "";
}

function visibleQuestionsFor(questions, answers) {
  return questions.filter(
    (question) => question?.variable && isQuestionVisible(question, answers)
  );
}

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
  const visibleQuestions = visibleQuestionsFor(questions, answers);
  const answeredVisibleQuestions = visibleQuestions.filter((q) =>
    hasAnswer(answers[q.variable])
  ).length;
  const requiredVisibleQuestions = visibleQuestions.filter((q) => q.required);
  const completedRequiredQuestions = requiredVisibleQuestions.filter((q) =>
    hasAnswer(answers[q.variable])
  ).length;

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
      <div className="plv2-shell flex flex-col h-full w-full overflow-hidden">
        <TopBar onClose={onClose} />
        <div className="flex-1 flex flex-col items-center justify-center gap-y-3 text-theme-text-secondary">
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
      className="plv2-shell flex flex-col h-full w-full overflow-hidden"
      onKeyDown={handleKeyDown}
    >
      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-x-3 px-4 md:px-6 py-4 border-b border-theme-sidebar-border shrink-0">
        <button
          type="button"
          onClick={onClose}
          aria-label="Back to chat"
          className="flex items-center gap-x-1.5 text-theme-text-secondary hover:text-theme-text-primary transition-colors text-sm focus:outline-none focus:text-theme-text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <div className="flex items-center gap-x-2 ml-2">
          <BookBookmark className="h-4 w-4 text-[var(--theme-button-primary)]" weight="fill" />
          <span className="text-sm font-semibold text-theme-text-primary">Prompt Library</span>
        </div>

        {/* Library selector — only show when multiple libraries */}
        {safeLibraries.length > 1 && (
          <div className="ml-auto relative">
            <select
              value={selectedId ?? ""}
              onChange={(e) => setSelectedId(Number(e.target.value) || null)}
              className="plv2-input appearance-none text-sm rounded-lg pl-3 pr-8 py-1.5 cursor-pointer"
              aria-label="Select prompt library"
            >
              <option value="" disabled>Select a library…</option>
              {safeLibraries.map((lib) => (
                <option key={lib.id} value={lib.id} className="bg-theme-bg-secondary text-theme-text-primary">
                  {lib.name ?? "Unnamed"}
                </option>
              ))}
            </select>
            <CaretDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-theme-text-secondary pointer-events-none" />
          </div>
        )}
      </div>

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6">
        {!selectedLib ? (
          // No library selected yet — show picker
          <LibraryPicker libraries={safeLibraries} onSelect={(id) => setSelectedId(id)} />
        ) : (
          <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
            <aside className="lg:sticky lg:top-0 lg:self-start">
              <TemplateSummaryCard
                library={selectedLib}
                totalVisibleQuestions={visibleQuestions.length}
                answeredVisibleQuestions={answeredVisibleQuestions}
                requiredVisibleQuestions={requiredVisibleQuestions.length}
                completedRequiredQuestions={completedRequiredQuestions}
                onChangeTemplate={
                  safeLibraries.length > 1 ? () => setSelectedId(null) : null
                }
              />
            </aside>

            <div className="flex min-w-0 flex-col gap-y-5">
              {questions.length === 0 ? (
                <div className="plv2-card rounded-2xl p-5">
                  <p className="text-sm text-theme-text-secondary italic">
                    This template has no questions. Click Generate to use it directly.
                  </p>
                </div>
              ) : (
                <>
                  <section className="plv2-card plv2-card-accent rounded-2xl p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-[0.18em] text-theme-text-secondary">
                          Input collection
                        </p>
                        <h2 className="mt-2 text-lg font-semibold text-theme-text-primary">
                          Provide the details for this prompt
                        </h2>
                        <p className="mt-1 text-sm text-theme-text-secondary">
                          Fill the required fields first, then add any optional context
                          that would make the output sharper.
                        </p>
                      </div>
                      <div className="plv2-pill shrink-0 px-3 py-1.5 text-xs">
                        {answeredVisibleQuestions}/{visibleQuestions.length} answered
                      </div>
                    </div>
                  </section>

                  <div className="flex flex-col gap-y-4">
                    {visibleQuestions.map((q, index) => {
                      const Component = FIELD_MAP[q.type] ?? TextField;
                      return (
                        <QuestionCard
                          key={q.variable}
                          id={`plv2-field-${q.variable}`}
                          index={index}
                          question={q}
                          answered={hasAnswer(answers[q.variable])}
                        >
                          <Component
                            question={q}
                            value={answers[q.variable] ?? ""}
                            onChange={handleChange}
                            error={errors[q.variable]}
                          />
                        </QuestionCard>
                      );
                    })}
                  </div>
                </>
              )}

              {questions.some((q) => q?.required) && (
                <p className="text-xs text-theme-text-secondary">
                  Fields marked with <span className="text-red-400">*</span> are required.
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Footer CTA ───────────────────────────────────────────────────── */}
      {selectedLib && (
        <div className="shrink-0 border-t border-theme-sidebar-border px-4 md:px-6 py-4 flex items-center justify-between gap-x-4">
          <div className="hidden md:flex flex-col gap-y-1">
            <p className="text-xs text-theme-text-secondary">
              Tip: press <kbd className="plv2-kbd px-1.5 py-0.5 rounded font-mono text-[10px]">Ctrl</kbd> +{" "}
              <kbd className="plv2-kbd px-1.5 py-0.5 rounded font-mono text-[10px]">Enter</kbd> to generate
            </p>
            <p className="text-[11px] text-theme-text-secondary">
              Required fields completed: {completedRequiredQuestions}/{requiredVisibleQuestions.length}
            </p>
          </div>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={submitting || success}
            aria-label="Generate prompt"
            className={`ml-auto flex items-center gap-x-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all focus:outline-none disabled:cursor-not-allowed ${
              success
                ? "bg-green-500/15 text-green-600 border border-green-500/30 dark:text-green-400"
                : "plv2-cta disabled:opacity-50"
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
    <div className="flex items-center gap-x-3 px-4 md:px-6 py-4 border-b border-theme-sidebar-border shrink-0">
      <button
        type="button"
        onClick={onClose}
        aria-label="Back to chat"
        className="flex items-center gap-x-1.5 text-theme-text-secondary hover:text-theme-text-primary transition-colors text-sm focus:outline-none focus:text-theme-text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>
      <div className="flex items-center gap-x-2 ml-2">
        <BookBookmark className="h-4 w-4 text-[var(--theme-button-primary)]" weight="fill" />
        <span className="text-sm font-semibold text-theme-text-primary">Prompt Library</span>
      </div>
    </div>
  );
}

function TemplateSummaryCard({
  library,
  totalVisibleQuestions,
  answeredVisibleQuestions,
  requiredVisibleQuestions,
  completedRequiredQuestions,
  onChangeTemplate,
}) {
  return (
    <div className="plv2-card plv2-card-accent rounded-2xl p-5 shadow-[0_16px_48px_rgba(0,0,0,0.12)]">
      <div className="flex items-center gap-x-2">
        <div className="plv2-icon-badge flex h-10 w-10 items-center justify-center rounded-xl">
          <BookBookmark className="h-5 w-5" weight="fill" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-theme-text-secondary">
            Selected template
          </p>
          <p className="text-sm font-semibold text-theme-text-primary">Prompt Library</p>
        </div>
      </div>

      <div className="mt-4">
        <h2 className="text-lg font-semibold text-theme-text-primary">{library.name ?? ""}</h2>
        <p className="mt-2 text-sm leading-6 text-theme-text-secondary">
          {library.description || "No description provided for this template yet."}
        </p>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <SummaryMetric
          label="Visible fields"
          value={String(totalVisibleQuestions)}
        />
        <SummaryMetric
          label="Answered"
          value={`${answeredVisibleQuestions}/${totalVisibleQuestions}`}
        />
        <SummaryMetric
          label="Required"
          value={String(requiredVisibleQuestions)}
        />
        <SummaryMetric
          label="Ready"
          value={`${completedRequiredQuestions}/${requiredVisibleQuestions}`}
        />
      </div>

      <div className="mt-5 rounded-xl border border-theme-sidebar-border bg-theme-bg-container px-4 py-3">
        <p className="text-[11px] uppercase tracking-[0.16em] text-theme-text-secondary">
          How to use
        </p>
        <p className="mt-2 text-sm leading-6 text-theme-text-secondary">
          Give concise business context first, then add the specifics that should
          influence tone, scope, or recommendations.
        </p>
      </div>

      {onChangeTemplate && (
        <button
          type="button"
          onClick={onChangeTemplate}
          className="mt-4 inline-flex items-center gap-x-1.5 rounded-xl border border-theme-sidebar-border px-3 py-2 text-sm text-theme-text-secondary transition-colors hover:bg-theme-bg-container hover:text-theme-text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Change template
        </button>
      )}
    </div>
  );
}

function SummaryMetric({ label, value }) {
  return (
    <div className="rounded-xl border border-theme-sidebar-border bg-theme-bg-container px-3 py-3">
      <p className="text-[11px] uppercase tracking-[0.12em] text-theme-text-secondary">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-theme-text-primary">{value}</p>
    </div>
  );
}

function QuestionCard({ id, index, question, answered, children }) {
  return (
    <section
      id={id}
      className={`rounded-2xl border p-5 transition-colors ${
        answered
          ? "plv2-card plv2-card-active"
          : "plv2-card"
      }`}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-x-3">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${
              answered
                ? "bg-[var(--theme-button-primary)] text-black"
                : "bg-theme-bg-container text-theme-text-secondary"
            }`}
          >
            {index + 1}
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-theme-text-secondary">
              {question.type === "textarea" ? "Detailed input" : "Input"}
            </p>
            <p className="mt-0.5 text-sm font-medium text-theme-text-primary">
              {question.label}
            </p>
          </div>
        </div>
        <div
          className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
            question.required
              ? "plv2-required-badge"
              : "plv2-optional-badge"
          }`}
        >
          {question.required ? "Required" : "Optional"}
        </div>
      </div>
      {children}
    </section>
  );
}

function LibraryPicker({ libraries, onSelect }) {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="plv2-card plv2-card-accent mb-6 rounded-2xl p-5">
        <p className="text-xs uppercase tracking-[0.18em] text-theme-text-secondary">
          Prompt Library
        </p>
        <h2 className="mt-2 text-xl font-semibold text-theme-text-primary">
          Choose a template to get started
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-theme-text-secondary">
          Select the prompt flow that best matches the task. Each template has its
          own description and a structured input form.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {libraries.map((lib) => (
          <button
            type="button"
            key={lib.id}
            onClick={() => onSelect(lib.id)}
            className="plv2-card group text-left rounded-2xl p-5 transition-all hover:-translate-y-0.5 focus:outline-none"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="plv2-icon-badge flex h-10 w-10 items-center justify-center rounded-xl transition-colors">
                <BookBookmark className="h-5 w-5" weight="fill" />
              </div>
              <ArrowRight className="mt-1 h-4 w-4 text-theme-text-secondary transition-colors group-hover:text-theme-text-primary" />
            </div>

            <div className="mt-5">
              <p className="text-base font-semibold text-theme-text-primary">
                {lib.name ?? "Unnamed"}
              </p>
              <p className="mt-2 min-h-[3rem] text-sm leading-6 text-theme-text-secondary">
                {lib.description || "No description available for this template."}
              </p>
            </div>

            <div className="mt-5 flex items-center justify-between border-t border-theme-sidebar-border pt-4">
              <p className="text-[11px] uppercase tracking-[0.16em] text-theme-text-secondary">
                {Array.isArray(lib.questions) ? lib.questions.length : 0} question
                {Array.isArray(lib.questions) && lib.questions.length !== 1 ? "s" : ""}
              </p>
              <span className="text-sm font-medium text-theme-text-secondary group-hover:text-theme-text-primary">
                Open
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function EmptyState({ onClose }) {
  return (
    <div className="plv2-shell flex flex-col h-full w-full overflow-hidden">
      <TopBar onClose={onClose} />
      <div className="flex-1 flex flex-col items-center justify-center gap-y-3 text-theme-text-secondary">
        <BookBookmark className="h-10 w-10 text-[var(--theme-button-primary)]" weight="duotone" />
        <p className="text-sm">No prompt libraries are available for this workspace.</p>
        <button
          type="button"
          onClick={onClose}
          className="text-xs text-theme-text-secondary hover:text-theme-text-primary underline underline-offset-2 transition-colors mt-2"
        >
          Back to chat
        </button>
      </div>
    </div>
  );
}
