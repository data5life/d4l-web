/**
 * TypeScript types for program steps and related structures
 */

import { Locale } from '@/i18n/config';

// Condition types
export type ConditionType = 'question' | 'survey' | 'and' | 'or' | 'offset' | 'not' | 'consent';
// D4L Condition Types:
// 'date' | 'question' | 'survey' | 'routine' | 'and' | 'or' | 'offset' | 'consent' | 'response';

export type QuestionType = 'coding' | 'date';

export type ConditionOperator = 'exists' | '=' | '!=' | '>' | '<' | '>=' | '<=';

export type SortingType = 'earliest' | 'latest';

// Step condition interface
export interface StepCondition {
  type: ConditionType;
  surveyName?: string;
  linkID?: string;
  questionType?: QuestionType;
  operand?: string;
  operator?: ConditionOperator;
  offset?: string; // ISO 8601 duration string
  item?: StepCondition;
  items?: StepCondition[];
  sorting?: SortingType;
  consentKey?: string;
}

// Threshold for eligibility steps
type ThresholdOperator = 'exists' | 'eq' | 'neq' | 'lt' | 'lteq' | 'gt' | 'gteq';

interface Threshold {
  operator: ThresholdOperator;
  value: number;
}

// Base program step
interface BaseProgramStep {
  type: 'consent' | 'token' | 'survey' | 'display' | 'eligibility';
  required: boolean;
  start?: StepCondition;
  end?: StepCondition;
  requiredCondition?: StepCondition;
}

// Consent step
export interface ConsentStep extends BaseProgramStep {
  type: 'consent';
  consentKey: string;
  minVersion?: number;
}

// Token step
export interface TokenStep extends BaseProgramStep {
  type: 'token';
  tokenLength: number;
}

// Survey step
export interface SurveyStep extends BaseProgramStep {
  type: 'survey';
  surveyName: string;
  standalone?: boolean;
}

// Display step
export interface DisplayStep extends BaseProgramStep {
  type: 'display';
  displayName: string;
  isCompleted?: boolean;
}

// Eligibility step
export interface EligibilityStep extends BaseProgramStep {
  type: 'eligibility';
  surveyName: string;
  threshold: Threshold;
  standalone?: boolean;
}

// Union of all step types (excluding sensor)
export type ProgramStep = ConsentStep | TokenStep | SurveyStep | DisplayStep | EligibilityStep;

// Program donation types
type RevocationType = 'delete' | 'anonymize';

type DateBlurringFunction =
  | 'startOfDay'
  | 'endOfDay'
  | 'startOfWeek'
  | 'endOfWeek'
  | 'startOfMonth'
  | 'endOfMonth';

interface BlurSettings {
  location: string; // timezone location
  authored?: DateBlurringFunction;
  period?: DateBlurringFunction;
}

interface ProgramAnonymization {
  blur?: BlurSettings;
}

export interface ProgramDonation {
  consentKey?: string;
  delay: number;
  revocation: RevocationType;
  anonymization?: ProgramAnonymization;
  target: string;
}

// Program content types
export type TranslatedString = Record<Locale, string>;

interface ProgramContact {
  email?: string;
  phone?: string;
}

interface ProgramInstitute {
  name: TranslatedString;
  image?: string;
}

interface ProgramPrivacyPolicy {
  text: TranslatedString;
}

interface ProgramParticipationInformation {
  text: TranslatedString;
}

interface ProgramEligibility {
  title: TranslatedString;
  description: TranslatedString;
  include: TranslatedString;
  exclude: TranslatedString;
}

export interface ProgramContent {
  title: TranslatedString;
  description: TranslatedString;
  contact: TranslatedString;
  contactInfo: ProgramContact;
  image?: string;
  institute?: ProgramInstitute;
  privacyPolicy?: ProgramPrivacyPolicy;
  participationInformation?: ProgramParticipationInformation;
  eligibility?: ProgramEligibility;
}

// Program featured
interface EstimatedEffort {
  value: number;
  unit: string;
}

export interface ProgramFeatured {
  enabled: boolean;
  showProgramImage?: boolean;
  showInstituteImage?: boolean;
  showContactInformation?: boolean;
  showSensors?: boolean;
  estimatedEffort?: EstimatedEffort;
  description?: TranslatedString;
}

// Program tags
type TagEffectiveType = 'dateTime' | 'period' | 'unknown';

export interface ProgramTag {
  code: string;
  labels: TranslatedString;
  effectiveType: TagEffectiveType;
}

// Program type
export type ProgramType = 'study' | 'sensor';

export type ProgramTheme = 'D4L' | 'GREEN' | 'PURPLE' | 'OLIVE' | 'BLUE';

// Main program interface
export interface Program {
  name: string;
  tenantID: string;
  languages: Locale[];
  type: ProgramType;
  phases: ProgramStep[][]; // array of phases, each phase is an array of steps
  donation: ProgramDonation;
  content: ProgramContent;
  endDate?: string; // ISO 8601 date with timezone
  tags?: ProgramTag[];
  publishedAt: string; // ISO 8601 date with timezone
  featured: ProgramFeatured;
  theme?: ProgramTheme;
}

// This guarantees us, that we don't call required on the ProgramStep by accident
export type SafeProgramStep = Omit<ProgramStep, 'required'>;
export type SafeProgram = Omit<Program, 'phases'> & {
  phases: SafeProgramStep[][];
};
