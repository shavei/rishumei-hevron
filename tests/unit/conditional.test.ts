import { describe, expect, it } from 'vitest';
import { isQuestionVisible, stripHiddenValues, visibleQuestions } from '@/lib/conditional/evaluate';
import type { QuestionDef } from '@/types/registration';

const primary: QuestionDef = { id: 'q_primary', type: 'presence', label: '', required: true, conditional_on: null };
const followup: QuestionDef = {
  id: 'q_transport',
  type: 'single_choice',
  label: '',
  required: true,
  options: [{ value: 'north', label: 'צפון' }],
  conditional_on: { question_id: 'q_primary', equals: 'present' },
};

describe('conditional evaluator', () => {
  it('shows unconditional questions', () => {
    expect(isQuestionVisible(primary, {})).toBe(true);
  });

  it('hides a follow-up until the condition matches', () => {
    expect(isQuestionVisible(followup, {})).toBe(false);
    expect(isQuestionVisible(followup, { q_primary: 'absent' })).toBe(false);
    expect(isQuestionVisible(followup, { q_primary: 'present' })).toBe(true);
  });

  it('treats undecided as a real answer (still not the trigger)', () => {
    expect(isQuestionVisible(followup, { q_primary: 'undecided' })).toBe(false);
  });

  it('matches multi_choice source by inclusion', () => {
    const q: QuestionDef = { ...followup, conditional_on: { question_id: 'q_multi', equals: 'a' } };
    expect(isQuestionVisible(q, { q_multi: ['a', 'b'] })).toBe(true);
    expect(isQuestionVisible(q, { q_multi: ['b'] })).toBe(false);
  });

  it('strips hidden values', () => {
    const schema = [primary, followup];
    const values = { q_primary: 'absent', q_transport: 'north' };
    expect(stripHiddenValues(schema, values)).toEqual({ q_primary: 'absent' });
    expect(visibleQuestions(schema, values)).toHaveLength(1);
  });
});
