/**
 * TypeScript types for the parsed questionnaire structure
 */

import { ArrayAnswerItem, ScalarAnswerItem } from '@d4l/collect-lib';

// Answer types
export type AnswerValue = string | number | string[] | null;

// Validation types
export interface TextValidation {
  minLength?: number;
  maxLength?: number;
}

export interface NumberValidation {
  min?: number;
  max?: number;
}

export interface DateOffset {
  value: number;
  unit: 'days' | 'weeks' | 'months' | 'years';
}

export interface DateValidation {
  min?: string;
  max?: string;
  relativeMin?: DateOffset;
  relativeMax?: DateOffset;
}

export interface SliderRange {
  min: number;
  max: number;
}

export interface SliderLabels {
  min: string;
  max: string;
}

// Choice option
export interface Option {
  value: string;
  label: string;
  system: string;
}

// Conditional display logic
export type Operator =
  | 'equals'
  | 'not-equals'
  | 'includes'
  | 'not-includes'
  | 'less-than'
  | 'less-than-or-equal'
  | 'greater-than'
  | 'greater-than-or-equal'
  | 'exists';

export interface Condition {
  questionId: string;
  operator: Operator;
  value?: AnswerValue;
}

export interface ShowWhen {
  behavior: 'all' | 'any';
  conditions: Condition[];
}

// Question types

export type SupportedScalarType =
  | 'string'
  | 'text'
  | 'decimal'
  | 'date'
  | 'year'
  | 'scale-numeric'
  | 'scale-ordinal'
  | 'single-select';
export type SupportedArrayType = 'multi-select';

type QuestionType = SupportedScalarType | SupportedArrayType;

export type AppScalarAnswerItem = Omit<ScalarAnswerItem, 'type'> & {
  type: SupportedScalarType;
};
export type AppArrayAnswerItem = Omit<ArrayAnswerItem, 'type'> & {
  type: SupportedArrayType;
};

// Base question interface
interface BaseQuestion {
  id: string;
  text: string;
  required: boolean;
  type: QuestionType;
  showWhen?: ShowWhen;
}

// Specific question types
export interface StringQuestion extends BaseQuestion {
  type: 'string';
  validation?: TextValidation;
}

export interface TextQuestion extends BaseQuestion {
  type: 'text';
  validation?: TextValidation;
}

export interface DecimalQuestion extends BaseQuestion {
  type: 'decimal';
  validation?: NumberValidation;
}

export interface DateQuestion extends BaseQuestion {
  type: 'date';
  validation?: DateValidation;
}

export interface YearQuestion extends BaseQuestion {
  type: 'year';
  validation?: DateValidation;
}

export interface ScaleOrdinalQuestion extends BaseQuestion {
  type: 'scale-ordinal';
  range: SliderRange;
  labels: SliderLabels;
}

export interface ScaleNumericalQuestion extends BaseQuestion {
  type: 'scale-numeric';
  range: SliderRange;
  step: number;
}

export interface SingleSelectQuestion extends BaseQuestion {
  type: 'single-select';
  options: Option[];
}

export interface MultiSelectQuestion extends BaseQuestion {
  type: 'multi-select';
  options: Option[];
}

// Union of all question types
export type Question =
  | StringQuestion
  | TextQuestion
  | DecimalQuestion
  | DateQuestion
  | YearQuestion
  | ScaleOrdinalQuestion
  | ScaleNumericalQuestion
  | SingleSelectQuestion
  | MultiSelectQuestion;

// Parsed questionnaire
export interface ParsedQuestionnaire {
  name: string;
  title: string;
  url: string;
  version: string;
  questions: Question[];
}

// State types for the questionnaire wizard
export interface QuestionnaireState {
  answers: Record<string, AnswerValue>;
  currentIndex: number;
  isComplete: boolean;
  hasCompletedOnce: boolean;
}

// Action types for the reducer
export type QuestionnaireAction =
  | { type: 'SET_ANSWER'; payload: { questionId: string; value: AnswerValue } }
  | { type: 'NEXT_QUESTION' }
  | { type: 'PREV_QUESTION' }
  | { type: 'GO_TO_QUESTION'; payload: number }
  | { type: 'COMPLETE' }
  | { type: 'RESET' }
  | { type: 'RESTORE_ANSWERS'; payload: { answers: Record<string, AnswerValue> } };
