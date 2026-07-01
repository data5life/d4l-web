/**
 * Tests for evaluateConditions utility
 * Tests conditional logic for showing/hiding questions based on answers
 */

import { describe, it, expect } from '@jest/globals';
import { shouldShowQuestion } from '@/lib/evaluateConditions';
import { Question, ShowWhen, AnswerValue } from '@/lib/questionnaireTypes';

// Helper to create a minimal question with showWhen
const createQuestionWithShowWhen = (showWhen: ShowWhen): Question => ({
  id: 'test-question',
  text: 'Test Question',
  type: 'text',
  required: false,
  showWhen,
});

describe('shouldShowQuestion - Conditional Logic', () => {
  describe('exists operator', () => {
    it('should return true when answer exists', () => {
      const question = createQuestionWithShowWhen({
        behavior: 'all',
        conditions: [{ questionId: 'q1', operator: 'exists' }],
      });
      const answers: Record<string, AnswerValue> = { q1: 'yes' };

      expect(shouldShowQuestion(question, answers)).toBe(true);
    });

    it('should return false when answer is undefined', () => {
      const question = createQuestionWithShowWhen({
        behavior: 'all',
        conditions: [{ questionId: 'q1', operator: 'exists' }],
      });
      const answers: Record<string, AnswerValue> = {};

      expect(shouldShowQuestion(question, answers)).toBe(false);
    });
  });

  describe('equals operator', () => {
    it('should return true when values match', () => {
      const question = createQuestionWithShowWhen({
        behavior: 'all',
        conditions: [{ questionId: 'q1', operator: 'equals', value: 'yes' }],
      });
      const answers: Record<string, AnswerValue> = { q1: 'yes' };

      expect(shouldShowQuestion(question, answers)).toBe(true);
    });

    it('should return false when values do not match', () => {
      const question = createQuestionWithShowWhen({
        behavior: 'all',
        conditions: [{ questionId: 'q1', operator: 'equals', value: 'yes' }],
      });
      const answers: Record<string, AnswerValue> = { q1: 'no' };

      expect(shouldShowQuestion(question, answers)).toBe(false);
    });
  });

  describe('includes operator', () => {
    it('should return true when array includes value', () => {
      const question = createQuestionWithShowWhen({
        behavior: 'all',
        conditions: [{ questionId: 'q1', operator: 'includes', value: 'option2' }],
      });
      const answers: Record<string, AnswerValue> = {
        q1: ['option1', 'option2', 'option3'],
      };

      expect(shouldShowQuestion(question, answers)).toBe(true);
    });

    it('should return false when array does not include value', () => {
      const question = createQuestionWithShowWhen({
        behavior: 'all',
        conditions: [{ questionId: 'q1', operator: 'includes', value: 'option4' }],
      });
      const answers: Record<string, AnswerValue> = {
        q1: ['option1', 'option2', 'option3'],
      };

      expect(shouldShowQuestion(question, answers)).toBe(false);
    });
  });

  describe('behavior: all (AND logic)', () => {
    it('should return true when all conditions are met', () => {
      const question = createQuestionWithShowWhen({
        behavior: 'all',
        conditions: [
          { questionId: 'q1', operator: 'equals', value: 'yes' },
          { questionId: 'q2', operator: 'equals', value: 'male' },
        ],
      });
      const answers: Record<string, AnswerValue> = {
        q1: 'yes',
        q2: 'male',
      };

      expect(shouldShowQuestion(question, answers)).toBe(true);
    });

    it('should return false when any condition fails', () => {
      const question = createQuestionWithShowWhen({
        behavior: 'all',
        conditions: [
          { questionId: 'q1', operator: 'equals', value: 'yes' },
          { questionId: 'q2', operator: 'equals', value: 'male' },
        ],
      });
      const answers: Record<string, AnswerValue> = {
        q1: 'yes',
        q2: 'female', // This doesn't match
      };

      expect(shouldShowQuestion(question, answers)).toBe(false);
    });
  });

  describe('behavior: any (OR logic)', () => {
    it('should return true when at least one condition is met', () => {
      const question = createQuestionWithShowWhen({
        behavior: 'any',
        conditions: [
          { questionId: 'q1', operator: 'equals', value: 'yes' },
          { questionId: 'q2', operator: 'equals', value: 'male' },
        ],
      });
      const answers: Record<string, AnswerValue> = {
        q1: 'no',
        q2: 'male', // Only this one matches
      };

      expect(shouldShowQuestion(question, answers)).toBe(true);
    });

    it('should return false when no conditions are met', () => {
      const question = createQuestionWithShowWhen({
        behavior: 'any',
        conditions: [
          { questionId: 'q1', operator: 'equals', value: 'yes' },
          { questionId: 'q2', operator: 'equals', value: 'male' },
        ],
      });
      const answers: Record<string, AnswerValue> = {
        q1: 'no',
        q2: 'female',
      };

      expect(shouldShowQuestion(question, answers)).toBe(false);
    });
  });

  describe('questions without showWhen', () => {
    it('should always return true when showWhen is undefined', () => {
      const question: Question = {
        id: 'q1',
        text: 'Question without conditions',
        type: 'text',
        required: false,
      };
      const answers: Record<string, AnswerValue> = {};

      expect(shouldShowQuestion(question, answers)).toBe(true);
    });
  });
});
