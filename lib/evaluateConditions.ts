/**
 * Evaluate showWhen conditions to determine question visibility
 */

import { Question, AnswerValue, Condition } from './questionnaireTypes';

/**
 * Evaluate a single condition against the current answers
 */
function evaluateCondition(condition: Condition, answers: Record<string, AnswerValue>): boolean {
  const { questionId, operator, value } = condition;
  const answer = answers[questionId];

  switch (operator) {
    case 'exists':
      return answer !== undefined && answer !== null && answer !== '';

    case 'equals':
      return answer === value;

    case 'not-equals':
      return answer !== value;

    case 'includes':
      // For multi-choice questions where answer is an array
      if (Array.isArray(answer)) {
        return answer.includes(value as string);
      }
      return false;

    case 'not-includes':
      // For multi-choice questions where answer is an array
      if (Array.isArray(answer)) {
        return !answer.includes(value as string);
      }
      return true;

    case 'less-than':
      if (typeof answer === 'number' && typeof value === 'number') {
        return answer < value;
      }
      if (typeof answer === 'string' && typeof value === 'string') {
        return answer < value;
      }
      return false;

    case 'less-than-or-equal':
      if (typeof answer === 'number' && typeof value === 'number') {
        return answer <= value;
      }
      if (typeof answer === 'string' && typeof value === 'string') {
        return answer <= value;
      }
      return false;

    case 'greater-than':
      if (typeof answer === 'number' && typeof value === 'number') {
        return answer > value;
      }
      if (typeof answer === 'string' && typeof value === 'string') {
        return answer > value;
      }
      return false;

    case 'greater-than-or-equal':
      if (typeof answer === 'number' && typeof value === 'number') {
        return answer >= value;
      }
      if (typeof answer === 'string' && typeof value === 'string') {
        return answer >= value;
      }
      return false;

    default:
      console.warn(`Unknown operator: ${operator}`);
      return true;
  }
}

/**
 * Evaluate showWhen conditions for a question
 * Returns true if the question should be visible
 */
export function shouldShowQuestion(
  question: Question,
  answers: Record<string, AnswerValue>,
): boolean {
  // If no showWhen conditions, always show
  if (!question.showWhen) {
    return true;
  }

  const { behavior, conditions } = question.showWhen;

  if (conditions.length === 0) {
    return true;
  }

  const results = conditions.map((condition) => evaluateCondition(condition, answers));

  if (behavior === 'any') {
    // OR logic: show if any condition is true
    return results.some((result) => result);
  } else {
    // AND logic (default): show only if all conditions are true
    return results.every((result) => result);
  }
}

/**
 * Get all visible questions based on current answers
 */
export function getVisibleQuestions(
  questions: Question[],
  answers: Record<string, AnswerValue>,
): Question[] {
  return questions.filter((question) => shouldShowQuestion(question, answers));
}

/**
 * Check if a question has been answered
 */
export function isQuestionAnswered(
  question: Question,
  answers: Record<string, AnswerValue>,
): boolean {
  const answer = answers[question.id];

  if (answer === undefined || answer === null) {
    return false;
  }

  if (typeof answer === 'string' && answer.trim() === '') {
    return false;
  }

  if (Array.isArray(answer) && answer.length === 0) {
    return false;
  }

  return true;
}

type ValidationError =
  | { key: 'numberMin'; values: { min: number } }
  | { key: 'numberMax'; values: { max: number } }
  | { key: 'textMinLength'; values: { min: number; current: number } }
  | { key: 'textMaxLength'; values: { max: number; current: number } }
  | { key: 'dateMin'; values: { min: string } }
  | { key: 'dateMax'; values: { max: string } };

/**
 * Get validation error for a question's answer
 * Returns null if answer is valid, or a structured error (key + values) for i18n
 */
export function getValidationError(
  question: Question,
  answers: Record<string, AnswerValue>,
): ValidationError | null {
  const answer = answers[question.id];

  // No answer provided - considered valid (required check is separate)
  if (answer === undefined || answer === null) {
    return null;
  }

  if (typeof answer === 'string' && answer.trim() === '') {
    return null;
  }

  // Validate number types (integer, decimal, quantity)
  if (question.type === 'decimal' && typeof answer === 'number') {
    const validation = question.validation;
    if (validation) {
      if (validation.min !== undefined && answer < validation.min) {
        return { key: 'numberMin', values: { min: validation.min } };
      }
      if (validation.max !== undefined && answer > validation.max) {
        return { key: 'numberMax', values: { max: validation.max } };
      }
    }
  }

  // Validate text types (string, text)
  if ((question.type === 'string' || question.type === 'text') && typeof answer === 'string') {
    const validation = question.validation;
    if (validation) {
      if (validation.minLength !== undefined && answer.length < validation.minLength) {
        return {
          key: 'textMinLength',
          values: { min: validation.minLength, current: answer.length },
        };
      }
      if (validation.maxLength !== undefined && answer.length > validation.maxLength) {
        return {
          key: 'textMaxLength',
          values: { max: validation.maxLength, current: answer.length },
        };
      }
    }
  }

  // Validate date types
  if ((question.type === 'date' || question.type === 'year') && typeof answer === 'string') {
    const validation = question.validation;
    if (validation) {
      if (validation.min !== undefined && answer < validation.min) {
        return { key: 'dateMin', values: { min: String(validation.min) } };
      }
      if (validation.max !== undefined && answer > validation.max) {
        return { key: 'dateMax', values: { max: String(validation.max) } };
      }
    }
  }

  return null;
}

/**
 * Check if a provided answer is valid according to the question's validation rules
 * Returns true if no answer is provided (empty values don't need validation)
 * Returns true if the answer meets all validation constraints
 */
export function isAnswerValid(question: Question, answers: Record<string, AnswerValue>): boolean {
  return getValidationError(question, answers) === null;
}
