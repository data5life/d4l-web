/**
 * Tests for getValidationError — structured (i18n-ready) validation errors.
 * The return value is a discriminated union keyed by `key`; the consumer
 * (QuestionnaireWizard) maps `key` to a translation namespace + interpolates `values`.
 */

import { describe, it, expect } from '@jest/globals';
import { getValidationError } from '@/lib/evaluateConditions';
import { Question, AnswerValue } from '@/lib/questionnaireTypes';

const decimal = (min?: number, max?: number): Question =>
  ({
    id: 'q',
    text: 'How much?',
    required: false,
    type: 'decimal',
    validation: { min, max },
  }) as Question;

const text = (minLength?: number, maxLength?: number): Question =>
  ({
    id: 'q',
    text: 'Describe it',
    required: false,
    type: 'string',
    validation: { minLength, maxLength },
  }) as Question;

const date = (min?: string, max?: string): Question =>
  ({
    id: 'q',
    text: 'When?',
    required: false,
    type: 'date',
    validation: { min, max },
  }) as Question;

const answers = (value: AnswerValue) => ({ q: value });

describe('getValidationError - structured errors', () => {
  it('returns null for a valid answer', () => {
    expect(getValidationError(decimal(0, 10), answers(5))).toBeNull();
  });

  it('returns null when no answer is provided', () => {
    expect(getValidationError(decimal(0, 10), {})).toBeNull();
    expect(getValidationError(decimal(0, 10), { q: null })).toBeNull();
  });

  it('reports numberMin with the bound', () => {
    expect(getValidationError(decimal(1), answers(0))).toEqual({
      key: 'numberMin',
      values: { min: 1 },
    });
  });

  it('reports numberMax with the bound', () => {
    expect(getValidationError(decimal(undefined, 10), answers(11))).toEqual({
      key: 'numberMax',
      values: { max: 10 },
    });
  });

  it('reports textMinLength with min and current length', () => {
    expect(getValidationError(text(5), answers('hi'))).toEqual({
      key: 'textMinLength',
      values: { min: 5, current: 2 },
    });
  });

  it('reports textMaxLength with max and current length', () => {
    expect(getValidationError(text(undefined, 3), answers('hello'))).toEqual({
      key: 'textMaxLength',
      values: { max: 3, current: 5 },
    });
  });

  it('reports dateMin with the bound as a string', () => {
    expect(getValidationError(date('2026-01-01'), answers('2025-12-31'))).toEqual({
      key: 'dateMin',
      values: { min: '2026-01-01' },
    });
  });

  it('reports dateMax with the bound as a string', () => {
    expect(getValidationError(date(undefined, '2026-01-01'), answers('2026-02-01'))).toEqual({
      key: 'dateMax',
      values: { max: '2026-01-01' },
    });
  });

  it('treats a blank string answer as no answer (valid)', () => {
    expect(getValidationError(text(5), answers('   '))).toBeNull();
  });
});
