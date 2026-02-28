/**
 * Utility: inject form answers into a template string.
 * Replaces all {{variable_name}} occurrences with the corresponding answer.
 * Unresolved variables are left as-is (not stripped).
 *
 * @param {string} template  - e.g. "Write a post about {{topic}} targeting {{audience}}"
 * @param {Record<string,string>} answers - e.g. { topic: "AI", audience: "developers" }
 * @returns {string}
 */
export function injectVariables(template, answers = {}) {
  return template.replace(/\{\{(\w+)\}\}/g, (_match, key) => {
    return answers[key] !== undefined && answers[key] !== "" ? answers[key] : _match;
  });
}

/**
 * Parse the `options` field which is stored as a JSON string in the DB.
 * @param {string|null} options
 * @returns {string[]}
 */
export function parseOptions(options) {
  if (!options) return [];
  try {
    return JSON.parse(options);
  } catch {
    return [];
  }
}

/**
 * Parse the `showIf` field: { variable, equals }.
 * @param {string|null} showIf
 * @returns {{ variable: string, equals: string }|null}
 */
export function parseShowIf(showIf) {
  if (!showIf) return null;
  try {
    return JSON.parse(showIf);
  } catch {
    return null;
  }
}

/**
 * Determine whether a question should be displayed given current form answers.
 * @param {{ showIf: string|null }} question
 * @param {Record<string,string>} answers
 * @returns {boolean}
 */
export function isQuestionVisible(question, answers) {
  const condition = parseShowIf(question.showIf);
  if (!condition) return true;
  return String(answers[condition.variable]) === String(condition.equals);
}

/**
 * Validate that all required visible questions have non-empty answers.
 * @param {Array} questions
 * @param {Record<string,string>} answers
 * @returns {{ valid: boolean, missing: string[] }}
 */
export function validateAnswers(questions, answers) {
  const missing = [];
  for (const q of questions) {
    if (!isQuestionVisible(q, answers)) continue;
    if (!q.required) continue;
    const val = answers[q.variable];
    if (val === undefined || val === null || String(val).trim() === "") {
      missing.push(q.variable);
    }
  }
  return { valid: missing.length === 0, missing };
}
