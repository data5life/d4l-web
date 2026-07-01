/**
 * Evaluate which tasks from the program phases are available for a user
 *
 * This module implements condition evaluation for program steps, supporting:
 * - step.start: Determines when a task becomes available
 * - step.end: Determines when a task expires
 * - step.requiredCondition: Overrides the required property dynamically
 *
 * Supported condition types:
 * - survey: Checks if a survey was completed
 * - consent: Checks if a consent was granted
 * - question: Checks specific answers from previous surveys
 * - and/or: Combines multiple conditions with logical operators
 * - offset: Adds time delays to condition fulfillment dates
 */

import {
  ProgramStep,
  SurveyStep,
  StepCondition,
  ConsentStep,
  SafeProgramStep,
} from './programTypes';
import { calculateIteration } from './iterationCalculator';
import { Temporal } from 'temporal-polyfill';
import { DashboardQuestionnaire } from '@/components/ProgramDashboardProvider';
import { AppAnswerItem } from './types/resource';

/**
 * Context data needed to evaluate step conditions
 */
export interface ConditionEvaluationContext {
  // Completed surveys with their completion dates
  completedSurveys: Map<string, Date>;

  // Granted consents with their grant dates
  grantedConsents: Map<string, Date>;

  // Survey answers for question-based conditions
  // Format: Map<surveyName, Map<linkID, answer>>
  surveyAnswers: Map<string, AppAnswerItem[]>;

  timeZone: string;
}

type TaskAccessResult =
  | { status: 'hidden' } // end passed, or required condition not met → don't show
  | { status: 'unavailable' } // prerequisite not yet satisfied, no date known → grey out
  | { status: 'pending'; availableFrom: Date } // condition met, but date is future → grey out with date
  | { status: 'accessible' }; // good to go

interface QuestionnaireTask {
  type: 'survey';
  currentIteration: number | undefined;
  questionnaireName: string;
}

export interface ConsentTask {
  type: 'consent';
  consentKey: string;
}

interface UnsupportedTask {
  title?: string;
  type: 'unsupported';
}

export type Task = (QuestionnaireTask | ConsentTask | UnsupportedTask) & {
  id: string;
  required: boolean;
  taskAccess: TaskAccessResult;
};

/**
 * Returns an Array of all possible Tasks,
 * containing the correct value for required, DO NOT ACCESS required VIA PROGRAM STEP
 * containing the access object with infos whether the task is accesible or not
 */
export function getAllTasks(
  phases: SafeProgramStep[][],
  completedQuestionnaires: Set<string>,
  completedConsents: Map<string, number>,
  context: ConditionEvaluationContext,
  currentDate: Date = new Date(),
  programQuestionnaire: Map<string, DashboardQuestionnaire>,
): Task[] {
  let phaseAccessible = true;

  const tasks: Task[][] = phases.map((phase) => {
    let foundRequiredNotCompletedTask = false;
    const phaseTasks = phase.map((step): Task => {
      const id = getTaskKey(step as ProgramStep);
      // Only handle survey (questionnaires) and consent steps
      if (step.type === 'survey') {
        const surveyStep = step as Omit<SurveyStep, 'required'>;

        const questionnaire = programQuestionnaire.get(surveyStep.surveyName);
        if (!questionnaire)
          throw new Error(`Could not find program questionnaire for ${surveyStep.surveyName}`);
        const frequency = questionnaire.frequency;

        const snapTime = extractSnapTime(frequency.start);

        const required = resolveRequired(step as ProgramStep, context, snapTime);
        if (!completedQuestionnaires.has(surveyStep.surveyName) && required) {
          foundRequiredNotCompletedTask = true;
        }

        if (!phaseAccessible) {
          return {
            id,
            type: 'survey',
            questionnaireName: questionnaire.name,
            currentIteration: undefined,
            taskAccess: { status: 'hidden' },
            required,
          };
        }

        // check iteration-aware completion
        const iterationResult = calculateIteration(frequency, context.timeZone, currentDate);

        // Hide if globally ended
        if (iterationResult.status === 'ended') {
          return {
            id,
            required,
            type: 'survey',
            currentIteration: undefined,
            questionnaireName: questionnaire.name,
            taskAccess: { status: 'hidden' },
          };
        }

        // Not yet started — show greyed out with start date
        if (iterationResult.status === 'not_started') {
          return {
            id,
            type: 'survey',
            required,
            questionnaireName: questionnaire.name,
            currentIteration: undefined,
            taskAccess: {
              status: 'pending',
              availableFrom: iterationResult.start,
            },
          };
        }

        const iterationInfo = iterationResult.info;

        if (frequency.type !== 'single' && frequency.type !== 'onDemand') {
          // Current iteration already submitted — show greyed out until next cycle
          const compositeKey = `${surveyStep.surveyName}-${iterationInfo.currentIteration}`;
          if (completedQuestionnaires.has(compositeKey)) {
            return {
              id,
              type: 'survey',
              required,
              questionnaireName: questionnaire.name,
              currentIteration: iterationResult.info.currentIteration,
              taskAccess: {
                status: 'pending',
                availableFrom: iterationInfo.iterationEnd!,
              },
            };
          }
        } else {
          if (completedQuestionnaires.has(surveyStep.surveyName))
            return {
              id,
              type: 'survey',
              required,
              currentIteration: iterationResult.info.currentIteration,
              questionnaireName: questionnaire.name,
              taskAccess: {
                status: 'hidden',
              },
            };
        }

        // Check if task is accessible based on conditions
        const access = evaluateTaskAccess(step, context, currentDate, snapTime);
        return {
          id,
          type: 'survey',
          required,
          currentIteration: iterationResult.info.currentIteration,
          questionnaireName: questionnaire.name,
          taskAccess: access,
        };
      } else if (step.type === 'consent') {
        const consentStep = step as Omit<ConsentStep, 'required'>;

        const required = resolveRequired(step as ProgramStep, context);

        if (!phaseAccessible) {
          return {
            id,
            type: 'consent',
            consentKey: consentStep.consentKey,
            taskAccess: { status: 'hidden' },
            required,
          };
        }

        const minVersion = consentStep.minVersion || 0;
        const versionAccepted = completedConsents.get(consentStep.consentKey);
        // Skip if already accepted the required consent version
        if (versionAccepted !== undefined && versionAccepted >= minVersion) {
          return {
            id,
            type: 'consent',
            consentKey: consentStep.consentKey,
            required,
            taskAccess: {
              status: 'hidden',
            },
          };
        }
        if (required) foundRequiredNotCompletedTask = true;
        // Skip if accepted or declined and not required
        if (versionAccepted !== undefined && !required) {
          return {
            id,
            type: 'consent',
            consentKey: consentStep.consentKey,
            required,
            taskAccess: {
              status: 'hidden',
            },
          };
        }

        // Check if task is accessible based on conditions
        const access = evaluateTaskAccess(step, context, currentDate);
        return {
          id,
          type: 'consent',
          required,
          consentKey: consentStep.consentKey,
          taskAccess: access,
        };
      } else {
        const required = resolveRequired(step as ProgramStep, context);
        return {
          id,
          type: 'unsupported',
          required,
          taskAccess: {
            status: phaseAccessible ? 'accessible' : 'hidden',
          },
        };
      }
    });

    if (foundRequiredNotCompletedTask) phaseAccessible = false;
    return phaseTasks;
  });

  return tasks.flat();
}

/**
 * Generate a unique key for a task based on its type
 */
function getTaskKey(step: ProgramStep): string {
  switch (step.type) {
    case 'survey':
      return `survey-${step.surveyName}`;
    case 'consent':
      return `consent-${step.consentKey}`;
    case 'display':
      return `display-${step.displayName}`;
    case 'eligibility':
      return `eligibility-${step.surveyName}`;
    case 'token':
      return `token-${step.tokenLength}`;
    default:
      const exhaustiveCheck: never = step;
      console.error(`Unknown step: ${exhaustiveCheck}`);

      return `unsupported`;
  }
}

/**
 * Evaluate the requiredCondition of a step and update its required property accordingly
 * Be aware: this mutates the input step
 */
function resolveRequired(
  step: ProgramStep,
  context: ConditionEvaluationContext,
  snapTime?: { hour: number; minute: number; second: number },
) {
  if (!step.requiredCondition) return step.required;

  const date = evaluateCondition(step.requiredCondition, context, snapTime);
  // condition met → required: true, unmet → required: false
  return date !== null;
}

/**
 * Check if a user can currently access a task based on conditions
 * Evaluates start/end/requiredCondition from steps
 */
export function evaluateTaskAccess(
  step: SafeProgramStep,
  context: ConditionEvaluationContext,
  currentDate: Date,
  snapTime?: { hour: number; minute: number; second: number },
): TaskAccessResult {
  // End condition — hide entirely if expired
  if (step.end) {
    const endDate = evaluateCondition(step.end, context, snapTime);
    if (endDate && endDate < currentDate) return { status: 'hidden' };
  }

  // Start condition — grey out if not yet met
  if (step.start) {
    const startDate = evaluateCondition(step.start, context, snapTime);
    if (!startDate) return { status: 'unavailable' };
    if (startDate > currentDate) return { status: 'pending', availableFrom: startDate };
  }

  return { status: 'accessible' };
}

/**
 * Extracts the time-of-day from a start date to use as a snap time
 * when localizing step offsets.
 */
export function extractSnapTime(frequencyStart: string): {
  hour: number;
  minute: number;
  second: number;
} {
  const time = Temporal.PlainTime.from(frequencyStart);
  return { hour: time.hour, minute: time.minute, second: time.second };
}

/**
 * Apply an ISO 8601 offset to a date.
 *
 * When a snap time is provided, the result is adjusted to that local time of day
 * in the user's timezone. This produces "next day at survey start time" semantics
 * for step-level offsets — e.g. a survey completed at any time on Monday becomes
 * available at 09:00 on Tuesday, regardless of when it was completed.
 *
 * Without a snap time, the duration is applied as a raw calendar-aware shift,
 * preserving the base date's time of day. DST transitions are handled correctly
 * in both cases via Temporal.ZonedDateTime.
 */
export function applyOffsetLocalized(
  date: Date,
  offset: string,
  timeZone: string,
  snapTime?: { hour: number; minute: number; second: number },
): Date {
  const duration = Temporal.Duration.from(offset);
  const baseZDT = Temporal.Instant.fromEpochMilliseconds(date.getTime()).toZonedDateTimeISO(
    timeZone,
  );
  const offsetZDT = snapTime ? baseZDT.add(duration).with(snapTime) : baseZDT.add(duration);

  return new Date(offsetZDT.epochMilliseconds);
}

/**
 * Evaluate a step condition and return the fulfillment date
 * Returns null if the condition is not met
 */
function evaluateCondition(
  condition: StepCondition,
  context: ConditionEvaluationContext,
  snapTime?: { hour: number; minute: number; second: number },
): Date | null {
  const timeZone = context.timeZone;
  switch (condition.type) {
    case 'survey': {
      // Condition met if survey is completed
      const completionDate = context.completedSurveys.get(condition.surveyName!);
      if (!completionDate) return null;

      // Apply offset if present
      if (condition.offset) {
        return applyOffsetLocalized(completionDate, condition.offset, timeZone, snapTime);
      }
      return completionDate;
    }

    case 'consent': {
      // Condition met if consent is granted
      const grantDate = context.grantedConsents.get(condition.consentKey!);
      if (!grantDate) return null;

      // Apply offset if present
      if (condition.offset) {
        return applyOffsetLocalized(grantDate, condition.offset, timeZone, snapTime);
      }
      return grantDate;
    }

    case 'question': {
      // Check if a specific question was answered with a specific value
      const surveyAnswers = context.surveyAnswers.get(condition.surveyName!);
      if (!surveyAnswers) return null;

      const answer = surveyAnswers.find((answer) => answer.id === condition.linkID!);
      if (answer === undefined) return null;
      if (answer.response === undefined) return null;

      // Evaluate operator
      const operator = condition.operator!;
      const operand = condition.operand;

      let conditionMet = false;

      type CompareValue = string | number | Date;

      let actualValue: CompareValue;
      let targetValue: CompareValue | undefined = operand;

      if (answer.type === 'date') {
        // NOTE: We currently map answer type 'year' to questionType 'coding'
        if (condition.questionType !== 'date') {
          throw new Error('Mismatched question type: expected date.');
        }
        actualValue = new Date(answer.response.value).getTime();
        if (operand) targetValue = new Date(operand).getTime();
      } else {
        if (condition.questionType !== 'coding') {
          throw new Error('Mismatched question type: expected coding.');
        }
        if (answer.type === 'multi-select') {
          actualValue = answer.response.some((r) => r.value === operand) ? 1 : 0;
          targetValue = 1;
        } else if (
          answer.type === 'decimal' ||
          answer.type === 'scale-numeric' ||
          answer.type === 'scale-ordinal'
        ) {
          actualValue = Number(answer.response.value);
          if (operand) targetValue = Number(operand);
        } else {
          actualValue = answer.response.value;
          targetValue = operand;
        }
      }

      switch (operator) {
        case 'exists':
          conditionMet = !!(answer && answer.response);
          break;
        case '=':
          conditionMet = actualValue === targetValue;
          break;
        case '!=':
          conditionMet = actualValue !== targetValue;
          break;
        case '>':
          if (targetValue === undefined) throw new Error("Operand missing for '>'");
          conditionMet = actualValue! > targetValue;
          break;
        case '>=':
          if (targetValue === undefined) throw new Error("Operand missing for '>='");
          conditionMet = actualValue! >= targetValue;
          break;
        case '<':
          if (targetValue === undefined) throw new Error("Operand missing for '<'");
          conditionMet = actualValue! < targetValue;
          break;
        case '<=':
          if (targetValue === undefined) throw new Error("Operand missing for '<='");
          conditionMet = actualValue! <= targetValue;
          break;
        default:
          throw new Error(`Unsupported operator: ${operator}`);
      }

      if (!conditionMet) return null;

      // For question conditions, we need to determine a date
      // Use the survey completion date
      const surveyCompletionDate = context.completedSurveys.get(condition.surveyName!);
      if (!surveyCompletionDate) return null;

      // For date-type questions, if we're comparing dates and using offset,
      // apply offset to the answer date
      // if (condition.questionType === 'date' && condition.offset) {
      //   return applyOffsetLocalized(new Date(answer as Date), condition.offset, timeZone);
      // }
      // This doesnt seem logical to me, why should we calc an offset based on the user answers
      // Would verify this maybe with D4L

      // For coding type, apply offset to survey completion date
      if (condition.offset) {
        return applyOffsetLocalized(surveyCompletionDate, condition.offset, timeZone);
      }

      return surveyCompletionDate;
    }

    case 'and': {
      // All sub-conditions must be met
      if (!condition.items || condition.items.length === 0) return null;

      const dates: Date[] = [];
      for (const item of condition.items) {
        const date = evaluateCondition(item, context, snapTime);
        if (!date) return null; // If any condition fails, AND fails
        dates.push(date);
      }

      // Sorting determines which date to use
      // Default for 'and' is 'latest' (all must be done, so pick the latest)
      const sorting = condition.sorting || 'latest';
      if (sorting === 'earliest') {
        return new Date(Math.min(...dates.map((d) => d.getTime())));
      } else {
        return new Date(Math.max(...dates.map((d) => d.getTime())));
      }
    }

    case 'or': {
      // At least one sub-condition must be met
      if (!condition.items || condition.items.length === 0) return null;

      const dates: Date[] = [];
      for (const item of condition.items) {
        const date = evaluateCondition(item, context, snapTime);
        if (date) {
          dates.push(date);
        }
      }

      if (dates.length === 0) return null; // None met

      // Sorting determines which date to use
      // Default for 'or' is 'earliest' (any can trigger, so pick the earliest)
      const sorting = condition.sorting || 'earliest';
      if (sorting === 'earliest') {
        return new Date(Math.min(...dates.map((d) => d.getTime())));
      } else {
        return new Date(Math.max(...dates.map((d) => d.getTime())));
      }
    }

    case 'offset': {
      // Apply offset to the sub-condition's result
      if (!condition.item) return null;

      const date = evaluateCondition(condition.item, context);
      if (!date) return null;

      if (condition.offset) {
        return applyOffsetLocalized(date, condition.offset, timeZone, snapTime);
      }
      return date;
    }

    default:
      console.warn(`Unknown condition type: ${condition.type}`);
      return null;
  }
}
