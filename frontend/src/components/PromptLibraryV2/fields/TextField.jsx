export default function TextField({ question, value, onChange }) {
  return (
    <div className="flex flex-col gap-y-1">
      <label className="text-xs font-medium text-theme-text-primary">
        {question.label}
        {question.required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <input
        type="text"
        value={value ?? ""}
        placeholder={question.placeholder || ""}
        onChange={(e) => onChange(question.variable, e.target.value)}
        className="text-sm rounded-lg px-3 py-2 bg-theme-bg-container border border-white/10 text-theme-text-primary placeholder:text-theme-text-secondary focus:outline-none focus:ring-1 focus:ring-primary-button"
      />
    </div>
  );
}
