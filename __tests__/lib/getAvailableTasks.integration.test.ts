import { describe, it, expect } from '@jest/globals';
import { getAllTasks, Task } from '@/lib/evaluateTasks';
import { TaskFrequency } from '@/lib/surveyTypes';
import { DashboardQuestionnaire } from '@/components/ProgramDashboardProvider';

const TZ = 'Europe/Berlin';

const makeFrequency = (overrides?: Partial<TaskFrequency>): TaskFrequency => ({
  type: 'single',
  start: '2024-01-01T09:00:00+01:00',
  ...overrides,
});

const makeQuestionnaire = (
  overrides?: Partial<DashboardQuestionnaire>,
): DashboardQuestionnaire => ({
  name: 'day2-survey',
  title: 'day2-survey',
  url: 'sensorhub/day2-survey',
  version: '1.0.0',
  questions: [],
  frequency: makeFrequency({ start: '2024-01-01T09:00:00+01:00' }),
  ...overrides,
});

describe('getAvailableTasks — offset localization', () => {
  it('sets availableFrom to 09:00 local time when start offset is not yet elapsed', () => {
    const completedAt = new Date('2024-03-14T22:00:00+01:00'); // 10pm Berlin
    const now = new Date('2024-03-15T08:00:00+01:00'); // 8am next day — before 9am snap

    const phases = [
      [
        {
          type: 'survey' as const,
          surveyName: 'day2-survey',
          required: true,
          start: { type: 'survey' as const, surveyName: 'day1-survey', offset: 'P1D' },
        },
      ],
    ];

    const context = {
      completedSurveys: new Map([['day1-survey', completedAt]]),
      grantedConsents: new Map(),
      surveyAnswers: new Map(),
      timeZone: TZ,
    };

    const tasks = getAllTasks(
      phases,
      new Set(),
      new Map(),
      context,
      now,
      new Map([
        [
          'day2-survey',
          makeQuestionnaire({ frequency: makeFrequency({ start: '2024-01-01T09:00:00+01:00' }) }),
        ],
      ]),
    );

    expect(tasks).toHaveLength(1);
    expect(tasks[0].taskAccess.status).toBe('pending');
    const pendingTask = tasks[0].taskAccess as Extract<Task['taskAccess'], { status: 'pending' }>;
    expect(
      pendingTask.availableFrom.toLocaleTimeString('en-GB', {
        timeZone: TZ,
        hour: '2-digit',
        minute: '2-digit',
      }),
    ).toBe('09:00');
  });

  it('makes the task accessible when the 09:00 snap time has passed', () => {
    const completedAt = new Date('2024-03-14T22:00:00+01:00');
    const now = new Date('2024-03-15T10:00:00+01:00'); // after 9am snap

    const phases = [
      [
        {
          type: 'survey' as const,
          surveyName: 'day2-survey',
          required: true,
          start: { type: 'survey' as const, surveyName: 'day1-survey', offset: 'P1D' },
        },
      ],
    ];

    const context = {
      completedSurveys: new Map([['day1-survey', completedAt]]),
      grantedConsents: new Map(),
      surveyAnswers: new Map(),
      timeZone: TZ,
    };

    const tasks = getAllTasks(
      phases,
      new Set(),
      new Map(),
      context,
      now,
      new Map([
        [
          'day2-survey',
          makeQuestionnaire({ frequency: makeFrequency({ start: '2024-01-01T09:00:00+01:00' }) }),
        ],
      ]),
    );

    expect(tasks).toHaveLength(1);
    expect(tasks[0].taskAccess.status).toBe('accessible');
  });
});

describe('getAvailableTasks — recurring survey with step offset', () => {
  const TZ = 'Europe/Berlin';

  const recurringFrequency: TaskFrequency = {
    type: 'daily',
    factor: 1,
    start: '2024-03-01T07:00:00+01:00', // 07:00 snap time
  };

  const phases = [
    [
      {
        type: 'survey' as const,
        surveyName: 'daily-survey',
        required: true,
        start: { type: 'survey' as const, surveyName: 'onboarding', offset: 'P1D' },
      },
    ],
  ];

  it('shows the recurring task as pending when the start offset snap time has not yet passed', () => {
    // Onboarding completed yesterday evening — P1D offset snaps to 07:00 today
    const onboardingCompleted = new Date('2024-03-14T20:00:00+01:00');
    const now = new Date('2024-03-15T06:59:00+01:00'); // 1 min before snap

    const context = {
      completedSurveys: new Map([['onboarding', onboardingCompleted]]),
      grantedConsents: new Map(),
      surveyAnswers: new Map(),
      timeZone: TZ,
    };

    const tasks = getAllTasks(
      phases,
      new Set(),
      new Map(),
      context,
      now,
      new Map([
        [
          'daily-survey',
          makeQuestionnaire({ name: 'daily-survey', frequency: recurringFrequency }),
        ],
      ]),
    );

    // Task should be pending with availableFrom set to the snap time
    expect(tasks).toHaveLength(1);
    expect(tasks[0].taskAccess.status).toBe('pending');
    const pendingTask = tasks[0].taskAccess as Extract<Task['taskAccess'], { status: 'pending' }>;
    expect(pendingTask.availableFrom).toEqual(new Date('2024-03-15T07:00:00+01:00'));
  });

  it('makes the recurring task accessible once the start offset snap time has passed', () => {
    const onboardingCompleted = new Date('2024-03-14T20:00:00+01:00');
    const now = new Date('2024-03-15T07:00:00+01:00'); // at snap time

    const context = {
      completedSurveys: new Map([['onboarding', onboardingCompleted]]),
      grantedConsents: new Map(),
      surveyAnswers: new Map(),
      timeZone: TZ,
    };

    const tasks = getAllTasks(
      phases,
      new Set(),
      new Map(),
      context,
      now,
      new Map([
        [
          'daily-survey',
          makeQuestionnaire({ name: 'daily-survey', frequency: recurringFrequency }),
        ],
      ]),
    );

    expect(tasks).toHaveLength(1);
    expect(tasks[0].taskAccess.status).toBe('accessible');
    const task = tasks[0] as Extract<Task, { type: 'survey' }>;
    expect(task.currentIteration).toBeDefined();
    expect(task.currentIteration).toBe(15);
  });
});

describe('getAvailableTasks — requiredCondition', () => {
  it('updates a required task to not required when the requiredCondition is not met', () => {
    const phases = [
      [
        {
          type: 'survey' as const,
          surveyName: 'follow-up',
          required: true,
          requiredCondition: { type: 'survey' as const, surveyName: 'baseline' },
        },
      ],
    ];

    const context = {
      completedSurveys: new Map(), // baseline not completed
      grantedConsents: new Map(),
      surveyAnswers: new Map(),
      timeZone: TZ,
    };

    const tasks = getAllTasks(
      phases,
      new Set(),
      new Map(),
      context,
      new Date('2024-03-15T10:00:00+01:00'),
      new Map([
        [
          'follow-up',
          makeQuestionnaire({
            name: 'follow-up',
            frequency: makeFrequency({ start: '2024-01-01T09:00:00+01:00' }),
          }),
        ],
      ]),
    );

    expect(tasks).toHaveLength(1);
    expect(tasks[0].required).toBeDefined();
    expect(tasks[0].required).toBe(false);
  });

  it('updates a not required task to required when the requiredCondition is met', () => {
    const phases = [
      [
        {
          type: 'survey' as const,
          surveyName: 'follow-up',
          required: false,
          requiredCondition: { type: 'survey' as const, surveyName: 'baseline' },
        },
      ],
    ];

    const context = {
      completedSurveys: new Map([['baseline', new Date('2024-03-14T20:00:00+01:00')]]), // baseline completed
      grantedConsents: new Map(),
      surveyAnswers: new Map(),
      timeZone: TZ,
    };

    const tasks = getAllTasks(
      phases,
      new Set(),
      new Map(),
      context,
      new Date('2024-03-15T10:00:00+01:00'),
      new Map([
        [
          'follow-up',
          makeQuestionnaire({
            name: 'follow-up',
            frequency: makeFrequency({ start: '2024-01-01T09:00:00+01:00' }),
          }),
        ],
      ]),
    );

    expect(tasks).toHaveLength(1);
    expect(tasks[0].required).toBeDefined();
    expect(tasks[0].required).toBe(true);
  });
});
