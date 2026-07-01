import { describe, it, expect } from '@jest/globals';
import { evaluateTaskAccess, ConditionEvaluationContext } from '@/lib/evaluateTasks';
import { SurveyStep } from '@/lib/programTypes';

const makeContext = (
  overrides?: Partial<ConditionEvaluationContext>,
): ConditionEvaluationContext => ({
  completedSurveys: new Map(),
  grantedConsents: new Map(),
  surveyAnswers: new Map(),
  timeZone: 'Europe/Berlin',
  ...overrides,
});

const now = new Date('2024-03-15T10:00:00Z');

describe('evaluateTaskAccess', () => {
  it('returns accessible when step has no conditions', () => {
    const testStep: SurveyStep = { type: 'survey', surveyName: 'foo', required: true };
    const result = evaluateTaskAccess(testStep, makeContext(), now);
    expect(result.status).toBe('accessible');
  });

  it('returns hidden when end condition has passed', () => {
    const pastDate = new Date('2024-03-01T00:00:00Z');
    const context = makeContext({ completedSurveys: new Map([['prereq', pastDate]]) });
    const step = {
      type: 'survey' as const,
      surveyName: 'foo',
      required: true,
      end: { type: 'survey' as const, surveyName: 'prereq' },
    };
    const result = evaluateTaskAccess(step, context, now);
    expect(result.status).toBe('hidden');
  });

  it('returns unavailable when start prerequisite survey is not completed', () => {
    const step = {
      type: 'survey' as const,
      surveyName: 'foo',
      required: true,
      start: { type: 'survey' as const, surveyName: 'not-completed' },
    };
    const result = evaluateTaskAccess(step, makeContext(), now);
    expect(result.status).toBe('unavailable');
  });

  it('returns pending with availableFrom when start condition is met but date is future', () => {
    const completedRecently = new Date('2024-03-14T20:00:00Z');
    const context = makeContext({ completedSurveys: new Map([['prereq', completedRecently]]) });
    const snapTime = { hour: 12, minute: 0, second: 0 };
    const step = {
      type: 'survey' as const,
      surveyName: 'foo',
      required: true,
      start: { type: 'survey' as const, surveyName: 'prereq', offset: 'P1D' },
    };
    const result = evaluateTaskAccess(step, context, now, snapTime);
    expect(result.status).toBe('pending');
    if (result.status === 'pending') {
      // Should be 12:00 the day after completion
      expect(result.availableFrom.toLocaleDateString('en-GB', { timeZone: 'Europe/Berlin' })).toBe(
        '15/03/2024',
      );
      expect(
        result.availableFrom.toLocaleTimeString('en-GB', {
          timeZone: 'Europe/Berlin',
          hour: '2-digit',
          minute: '2-digit',
        }),
      ).toBe('12:00');
    }
  });

  it('returns accessible when start condition offset has already elapsed', () => {
    const completedTwoDaysAgo = new Date('2024-03-13T08:00:00Z');
    const context = makeContext({ completedSurveys: new Map([['prereq', completedTwoDaysAgo]]) });
    const snapTime = { hour: 9, minute: 0, second: 0 };
    const step = {
      type: 'survey' as const,
      surveyName: 'foo',
      required: true,
      start: { type: 'survey' as const, surveyName: 'prereq', offset: 'P1D' },
    };
    const result = evaluateTaskAccess(step, context, now, snapTime);
    expect(result.status).toBe('accessible');
  });
});
