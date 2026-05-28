// The ONE conditional evaluator (spec §13.3, §22.5). Shared by the student flow,
// the admin builder, and the live preview. Do not write a second implementation.
import type { QuestionDef, ResponseValues } from '@/types/registration';
import { normalizeHebrew } from '@/lib/hebrew/normalize';

/**
 * A question is visible iff it has no condition, or the referenced question's
 * answer equals the rule's value. For multi_choice sources, "equals" means the
 * value is included in the selected array.
 */
export function isQuestionVisible(question: QuestionDef, values: ResponseValues): boolean {
  const cond = question.conditional_on;
  if (!cond) return true;

  const actual = values[cond.question_id];
  if (actual === undefined || actual === null) return false;

  if (Array.isArray(actual)) {
    return actual.some((v) => valuesEqual(v, cond.equals));
  }
  return valuesEqual(actual, cond.equals);
}

function valuesEqual(a: unknown, b: unknown): boolean {
  if (typeof a === 'string' && typeof b === 'string') {
    return normalizeHebrew(a) === normalizeHebrew(b);
  }
  return a === b;
}

/** The subset of questions currently visible given the answers, in order. */
export function visibleQuestions(schema: QuestionDef[], values: ResponseValues): QuestionDef[] {
  return schema.filter((q) => isQuestionVisible(q, values));
}

/**
 * Strip values for hidden questions (spec §13.3): hidden answers must not be
 * persisted. Mirrors the server-side `rh.clean_response`.
 */
export function stripHiddenValues(schema: QuestionDef[], values: ResponseValues): ResponseValues {
  const out: ResponseValues = {};
  for (const q of schema) {
    if (isQuestionVisible(q, values) && values[q.id] !== undefined) {
      out[q.id] = values[q.id];
    }
  }
  return out;
}
