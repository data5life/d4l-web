/**
 * TypeScript types for Survey, TaskFrequency, and TaskReminder
 * Based on the SensorHub API specification (Types.md)
 */

import { TranslatedString } from './programTypes';

export type FrequencyType = 'single' | 'daily' | 'weekly' | 'monthly' | 'onDemand';

type ReminderFrequencyType = 'daily' | 'beforeExpiry';

export interface TaskFrequency {
  type: FrequencyType;
  start: string; // ISO 8601 date with timezone
  end?: string; // ISO 8601 date with timezone
  location?: string; // Timezone location, e.g. "Europe/Berlin"
  factor?: number; // Multiplier for cycle length
  editDuration?: string; // ISO 8601 duration string
  skipFirst?: boolean;
  retainCTAs?: number;
  allowAddOnDemand?: boolean;
}

export interface TaskReminder {
  frequency: ReminderFrequencyType;
}

export interface SurveyContent {
  default: {
    title: TranslatedString;
    description?: TranslatedString;
    image?: string;
    icon?: string;
  };
}

export interface SurveyScoring {
  scores: {
    valueset?: Record<string, Record<string, number>>;
    number?: Record<string, Array<{ operator: string; threshold: number; score: number }>>;
  };
}

export interface Survey {
  name: string;
  programName: string;
  frequency: TaskFrequency;
  scoring?: SurveyScoring;
  content: SurveyContent;
  reminder?: TaskReminder;
  template?: string;
}
