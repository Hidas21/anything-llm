import { parseOptions } from "../utils";

/**
 * Multi-select field — value stored as comma-separated string in answers.
 */
export default function MultiSelectField({ question, value, onChange }) {
  const options = parseOptions(question.options);
  const selected = value ? value.split(",").map((v) => v.trim()) : [];

  function toggle(opt) {
    const next = selected.includes(opt)
      ? selected.filter((s) => s !== opt)
      : [...selected, opt];
    onChange(question.variable, next.join(", "));
  }

  return (
    <div className="flex flex-col gap-y-1">
      <label className="text-xs font-medium text-theme-text-primary">
        {question.label}
        {question.required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const active = selected.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              onClick={() => toggle(opt)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                active
                  ? "bg-primary-button/20 border-primary-button text-primary-button"
                  : "bg-transparent border-white/20 text-theme-text-secondary hover:border-white/40"
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}
