/**
 * Checkbox field — value stored as "true" / "false" string in answers.
 */
export default function CheckboxField({ question, value, onChange }) {
  const checked = value === "true" || value === true;
  return (
    <div className="flex items-center gap-x-2">
      <input
        id={`plv2-cb-${question.variable}`}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(question.variable, String(e.target.checked))}
        className="w-4 h-4 accent-primary-button cursor-pointer"
      />
      <label
        htmlFor={`plv2-cb-${question.variable}`}
        className="text-xs font-medium text-theme-text-primary cursor-pointer select-none"
      >
        {question.label}
        {question.required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
    </div>
  );
}
