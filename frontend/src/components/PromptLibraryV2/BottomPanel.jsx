import { useState, useCallback } from "react";
import { BookBookmark, X, ArrowFatLineRight } from "@phosphor-icons/react";
import QuestionForm from "./QuestionForm";
import { injectVariables, validateAnswers } from "./utils";

/**
 * Slide-up bottom panel for Prompt Library V2.
 * Dispatches a custom DOM event `prompt-library-v2:generate` with { prompt: string }
 * so ChatContainer can pick it up without tight coupling.
 *
 * @param {{
 *   libraries: Array,
 *   onClose: Function,
 * }} props
 */
export default function BottomPanel({ libraries, onClose }) {
  const [selectedId, setSelectedId] = useState(null);
  const [answers, setAnswers] = useState({});
  const [errors, setErrors] = useState([]);

  const selectedLib = libraries.find((l) => l.id === selectedId) ?? null;

  const handleChange = useCallback((variable, value) => {
    setAnswers((prev) => ({ ...prev, [variable]: value }));
    setErrors((prev) => prev.filter((v) => v !== variable));
  }, []);

  function handleSelectLib(lib) {
    setSelectedId(lib.id);
    // Pre-populate defaults
    const defaults = {};
    for (const q of lib.questions ?? []) {
      if (q.defaultValue !== null && q.defaultValue !== undefined) {
        defaults[q.variable] = q.defaultValue;
      }
    }
    setAnswers(defaults);
    setErrors([]);
  }

  function handleGenerate() {
    if (!selectedLib) return;

    const { valid, missing } = validateAnswers(selectedLib.questions ?? [], answers);
    if (!valid) {
      setErrors(missing);
      return;
    }

    const prompt = injectVariables(selectedLib.template, answers);
    window.dispatchEvent(
      new CustomEvent("prompt-library-v2:generate", { detail: { prompt } })
    );
    onClose();
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed bottom-0 left-0 right-0 z-50 flex flex-col bg-theme-bg-secondary border-t border-white/10 rounded-t-2xl shadow-2xl max-h-[70vh] animate-plv2-slide-up">
        {/* Header */}
        <div className="flex items-center gap-x-2 px-4 py-3 border-b border-white/10 shrink-0">
          <BookBookmark className="h-4 w-4 text-primary-button" weight="fill" />
          <span className="text-sm font-semibold text-theme-text-primary">
            Prompt Library
          </span>
          <button
            type="button"
            onClick={onClose}
            className="ml-auto text-theme-text-secondary hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Library list */}
          <div className="w-48 shrink-0 border-r border-white/10 overflow-y-auto py-2">
            {libraries.length === 0 && (
              <p className="px-3 py-2 text-xs text-theme-text-secondary italic">
                No libraries available.
              </p>
            )}
            {libraries.map((lib) => (
              <button
                type="button"
                key={lib.id}
                onClick={() => handleSelectLib(lib)}
                className={`w-full text-left px-3 py-2 text-xs transition-colors ${
                  selectedId === lib.id
                    ? "bg-primary-button/20 text-primary-button font-medium"
                    : "text-theme-text-secondary hover:bg-white/5 hover:text-white"
                }`}
              >
                <span className="block truncate">{lib.name}</span>
                {lib.description && (
                  <span className="block truncate text-[10px] opacity-60 mt-0.5">
                    {lib.description}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Question form + generate */}
          <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-y-4">
            {!selectedLib ? (
              <p className="text-xs text-theme-text-secondary italic mt-2">
                ← Select a library to get started.
              </p>
            ) : (
              <>
                <div>
                  <p className="text-sm font-medium text-theme-text-primary mb-0.5">
                    {selectedLib.name}
                  </p>
                  {selectedLib.description && (
                    <p className="text-xs text-theme-text-secondary">
                      {selectedLib.description}
                    </p>
                  )}
                </div>

                {errors.length > 0 && (
                  <p className="text-xs text-red-400">
                    Please fill in all required fields before generating.
                  </p>
                )}

                <QuestionForm
                  questions={selectedLib.questions ?? []}
                  answers={answers}
                  onChange={handleChange}
                />

                <button
                  type="button"
                  onClick={handleGenerate}
                  className="mt-auto self-end flex items-center gap-x-1.5 px-4 py-2 rounded-lg bg-primary-button hover:bg-primary-button/80 text-white text-sm font-medium transition-colors"
                >
                  Generate
                  <ArrowFatLineRight className="h-4 w-4" weight="fill" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
