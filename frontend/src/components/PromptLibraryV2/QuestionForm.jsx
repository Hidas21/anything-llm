import { isQuestionVisible } from "./utils";
import TextField from "./fields/TextField";
import TextareaField from "./fields/TextareaField";
import NumberField from "./fields/NumberField";
import SelectField from "./fields/SelectField";
import MultiSelectField from "./fields/MultiSelectField";
import CheckboxField from "./fields/CheckboxField";

const FIELD_MAP = {
  text: TextField,
  textarea: TextareaField,
  number: NumberField,
  select: SelectField,
  multiselect: MultiSelectField,
  checkbox: CheckboxField,
};

/**
 * Renders the dynamic question form for a selected library.
 * @param {{ questions: Array, answers: Record<string,string>, onChange: Function }} props
 */
export default function QuestionForm({ questions = [], answers, onChange }) {
  if (questions.length === 0) {
    return (
      <p className="text-xs text-theme-text-secondary italic">
        This template has no questions — just click Generate.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-y-3">
      {questions.map((q) => {
        if (!isQuestionVisible(q, answers)) return null;
        const Component = FIELD_MAP[q.type] ?? TextField;
        return (
          <Component
            key={q.variable}
            question={q}
            value={answers[q.variable] ?? q.defaultValue ?? ""}
            onChange={onChange}
          />
        );
      })}
    </div>
  );
}
