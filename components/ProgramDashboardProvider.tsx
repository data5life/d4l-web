'use client';

import {
  createContext,
  useContext,
  useReducer,
  useMemo,
  useCallback,
  ReactNode,
  useEffect,
} from 'react';

import { AppAnswerItem, Resource } from '@/lib/types/resource';
import { ParsedQuestionnaire } from '@/lib/questionnaireTypes';
import { getProgramConsents, ProgramConsent } from '@/lib/getProgramConsents';
import { Survey, TaskReminder } from '@/lib/surveyTypes';
import { ConsentStep, Program, SafeProgram } from '@/lib/programTypes';
import { Locale } from '@/i18n/config';
import { createDonationClient } from '@/lib/donation/create-client';
import { getQuestionnaires } from '@/lib/getQuestionnaires';
import { getSurveys } from '@/lib/getSurveys';
import { getResources } from '@/lib/getResources';
import { DonorIdentity, TaskFrequency } from '@d4l/collect-lib';
import { ConditionEvaluationContext, getAllTasks, Task } from '@/lib/evaluateTasks';
import { parseResources } from '@/lib/fhir-parser/resource';

export type DashboardConsent = ProgramConsent & {
  accepted: boolean | null;
  updatedAt?: string;
};

export type DashboardQuestionnaire = ParsedQuestionnaire & {
  frequency: TaskFrequency;
  reminder?: TaskReminder;
};

export interface DashboardSuccessData {
  resources: Resource[];

  programQuestionnaires: Map<string, DashboardQuestionnaire>;
  dashboardConsents: Map<string, DashboardConsent>;
}

interface ProgramDashboardState {
  lang: Locale;
  program: SafeProgram;
  did: DonorIdentity;
  data:
    | { status: 'loading'; progress: number }
    | { status: 'error'; error: Error }
    | ({ status: 'success' } & DashboardSuccessData);
}

type DashboardWithData = Extract<ProgramDashboardState['data'], { status: 'success' }>;

interface ProgramDashboardContextType {
  state: ProgramDashboardState;
  allTasks: Task[] | null;
  processedConsents: DashboardConsent[];
  updateConsent: (payload: Resource[]) => void;
  submitQuestionnaire: (payload: Resource) => void;
}

type ProgramDashboardAction =
  | { type: 'FETCH_INIT'; payload: { program: Program; did: DonorIdentity; lang: Locale } }
  | { type: 'FETCH_PROGRESS'; payload: number }
  | {
      type: 'FETCH_SUCCESS';
      payload: {
        resources: Resource[];
        questionnaireMap: Map<string, DashboardQuestionnaire>;
        consentMap: Map<string, DashboardConsent>;
      };
    }
  | { type: 'FETCH_ERROR'; payload: Error }
  | { type: 'UPDATE_CONSENT'; payload: Resource[] }
  | { type: 'SUBMIT_QUESTIONNAIRE'; payload: Resource };

function programDashboardReducer(
  state: ProgramDashboardState,
  action: ProgramDashboardAction,
): ProgramDashboardState {
  switch (action.type) {
    case 'FETCH_INIT':
      return {
        program: action.payload.program,
        lang: action.payload.lang,
        did: action.payload.did,
        data: {
          status: 'loading',
          progress: 0,
        },
      };
    case 'FETCH_PROGRESS':
      if (state.data.status === 'loading') {
        return {
          ...state,
          data: { ...state.data, progress: action.payload },
        };
      }
      return state;
    case 'FETCH_SUCCESS': {
      return {
        ...state,
        data: {
          status: 'success',
          programQuestionnaires: action.payload.questionnaireMap,
          dashboardConsents: action.payload.consentMap,
          resources: action.payload.resources,
        },
      };
    }
    case 'FETCH_ERROR':
      return {
        ...state,
        data: {
          status: 'error',
          error: action.payload,
        },
      };
    case 'UPDATE_CONSENT': {
      if (state.data.status !== 'success') return state;

      const nextProgramConsents = new Map(state.data.dashboardConsents);
      const nextResources = [...state.data.resources];

      action.payload.forEach((updatedResource) => {
        const resourceIndex = nextResources.findIndex((r) => r.id === updatedResource.id);
        if (resourceIndex !== -1) {
          nextResources[resourceIndex] = updatedResource;
        } else {
          nextResources.push(updatedResource);
        }

        if (updatedResource.type === 'Consent') {
          const existingConsent = nextProgramConsents.get(updatedResource.name);
          if (!existingConsent)
            throw new Error('Unexpected error: Could not find consent, state mismatch');

          nextProgramConsents.set(updatedResource.name, {
            ...existingConsent,
            accepted: updatedResource.accepted,
            updatedAt: updatedResource.date,
          });
        }
      });

      return {
        ...state,
        data: {
          ...state.data,
          resources: nextResources,
          dashboardConsents: nextProgramConsents,
        },
      };
    }
    case 'SUBMIT_QUESTIONNAIRE': {
      if (state.data.status !== 'success') return state;
      const updatedResource = action.payload;
      if (updatedResource.type !== 'Questionnaire') return state;

      const nextResources = [...state.data.resources];

      const resourceIndex = nextResources.findIndex((r) => r.id === updatedResource.id);
      if (resourceIndex !== -1) {
        nextResources[resourceIndex] = updatedResource;
      } else {
        nextResources.push(updatedResource);
      }

      return {
        ...state,
        data: {
          ...state.data,
          resources: nextResources,
        },
      };
    }
    default:
      const _exhaustiveCheck: never = action;
      return state;
  }
}

const ProgramDashboardContext = createContext<ProgramDashboardContextType | null>(null);

interface ProgramDashboardProps {
  children: ReactNode;
  program: Program;
  did: DonorIdentity;
  lang: Locale;
}

export function ProgramDashboardProvider({ children, program, did, lang }: ProgramDashboardProps) {
  const [state, dispatch] = useReducer(programDashboardReducer, {
    program,
    lang,
    did,
    data: { status: 'loading', progress: 0 },
  });
  const programName = program.name;

  useEffect(() => {
    let ignore = false;

    async function load() {
      // INFO: I currently fetch everything on the client side. Server side fetching would be faster,
      // but client side fetching could enable caching via e.g. Indexed DB in the future
      dispatch({ type: 'FETCH_INIT', payload: { program, did, lang } });

      try {
        const client = createDonationClient();

        let completedWeight = 0;

        const TASKS = {
          QUESTIONNAIRES: { id: 'questionnaires', weight: 3 },
          CONSENTS: { id: 'consents', weight: 1 },
          SURVEYS: { id: 'surveys', weight: 2 },
          RESOURCES: { id: 'resources', weight: 3.5 },
        } as const;

        const TOTAL_WEIGHT = Object.values(TASKS).reduce((sum, task) => sum + task.weight, 0);

        const completeTask = (weight: number): void => {
          completedWeight += weight;
          const percentage = Math.round((completedWeight / TOTAL_WEIGHT) * 100);
          if (!ignore) {
            dispatch({ type: 'FETCH_PROGRESS', payload: Math.min(percentage, 100) });
          }
        };

        const questionnairesTask = getQuestionnaires(programName, lang, false).then((data) => {
          completeTask(TASKS.QUESTIONNAIRES.weight);
          return data;
        });

        const consentsTask = getProgramConsents(programName, false).then((data) => {
          completeTask(TASKS.CONSENTS.weight);
          return data;
        });

        const surveysTask = getSurveys(programName, false).then((data) => {
          completeTask(TASKS.SURVEYS.weight);
          return data;
        });

        const donationsTask = getResources(client, did, programName).then((data) => {
          completeTask(TASKS.RESOURCES.weight);
          return data;
        });

        const [programQuestionnaires, programConsents, surveys, donations] = await Promise.all([
          questionnairesTask,
          consentsTask,
          surveysTask,
          donationsTask,
        ]);

        const consentMap = new Map<string, DashboardConsent>();
        const questionnaireMap = new Map<string, DashboardQuestionnaire>();
        const surveysMap = new Map<string, Survey>();

        surveys.forEach((s) => {
          surveysMap.set(s.name, s);
        });

        programQuestionnaires.forEach((q) => {
          const survey = surveysMap.get(q.name);
          if (!survey) throw new Error(`Could not find survey for questionnaire ${q.name}`);
          questionnaireMap.set(q.name, {
            ...q,
            frequency: survey.frequency,
            reminder: survey.reminder,
          });
        });

        const resources = parseResources(donations, programName, questionnaireMap);

        const consentAcceptanceMap = new Map<string, { accepted: boolean; updatedAt: string }>();
        resources.forEach((r) => {
          if (r.type === 'Consent')
            consentAcceptanceMap.set(r.name, { accepted: r.accepted, updatedAt: r.date });
        });

        programConsents.forEach((c) => {
          const acceptedConsentInfo = consentAcceptanceMap.get(c.name);
          const oldConsent = consentMap.get(c.name);
          if (!oldConsent || oldConsent.version < c.version)
            consentMap.set(c.name, {
              accepted: acceptedConsentInfo?.accepted ?? null,
              updatedAt: acceptedConsentInfo?.updatedAt ?? undefined,
              ...c,
            });
        });

        if (!ignore) {
          dispatch({
            type: 'FETCH_SUCCESS',
            payload: {
              questionnaireMap,
              consentMap,
              resources,
            },
          });
        }
      } catch (error) {
        if (!ignore) {
          dispatch({
            type: 'FETCH_ERROR',
            payload: error instanceof Error ? error : new Error('An unexpected error occurred'),
          });
        }
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, [program, programName, lang, did]);

  const allTasks = useMemo(() => {
    if (state.data.status !== 'success') return [];

    try {
      const resources = state.data.resources;
      const programQuestionnaire = state.data.programQuestionnaires;
      const phases = state.program.phases;

      // Create a set of completed questionnaire IDs (plain + composite iteration keys)
      const completedQuestionnaires = new Set<string>();

      // Create a map of survey completion dates (use the earliest submission for each)
      const surveyCompletionDates = new Map<string, Date>();
      const surveyAnswers = new Map<string, AppAnswerItem[]>();

      const completedConsents = new Map<string, number>();
      const grantedConsentDates = new Map<string, Date>();

      for (const resource of resources) {
        if (resource.type === 'Consent') {
          const c = resource;
          const consentStep = phases
            .flat()
            .find(
              (step): step is ConsentStep => 'consentKey' in step && step.consentKey === c.name,
            );
          if (!consentStep) {
            throw new Error(
              `Unexpected Error: Could not find consent step ${c.name} in program phases`,
            );
          }

          if (c.accepted || !consentStep.required) {
            completedConsents.set(c.name, c.version);
            if (c.accepted) grantedConsentDates.set(c.name, new Date(c.date));
          }
        } else if (resource.type === 'Questionnaire') {
          if (resource.status === 'completed') {
            const questionnaireName = resource.questionnaire.name;
            completedQuestionnaires.add(questionnaireName);
            completedQuestionnaires.add(
              `${questionnaireName}-${resource.iteration.currentIteration}`,
            );

            const submittedAt = new Date(resource.createdAt);
            const existing = surveyCompletionDates.get(questionnaireName);
            if (!existing || submittedAt < existing) {
              surveyCompletionDates.set(questionnaireName, submittedAt);
            }
          }
          // const iterationNumber = calculateIteration()
        }
      }

      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      // Create evaluation context
      const context: ConditionEvaluationContext = {
        completedSurveys: surveyCompletionDates,
        grantedConsents: grantedConsentDates,
        surveyAnswers,
        timeZone,
      };

      // Get available tasks from program phases
      const allTasks = getAllTasks(
        phases,
        completedQuestionnaires,
        completedConsents,
        context,
        new Date(),
        programQuestionnaire,
      );
      return allTasks;
    } catch {
      return null;
    }
  }, [state.data, state.program.phases]);

  const programQuestionnaires =
    state.data.status === 'success' ? state.data.programQuestionnaires : null;
  useEffect(() => {
    if (state.data.status !== 'success' || !allTasks || !programQuestionnaires) return;
    const controller = new AbortController();
    const tasks = allTasks;
    const questionnaires = programQuestionnaires;

    async function syncNotifications() {
      try {
        const questionnaireNotifs = tasks
          .map((task) => {
            if (task.type !== 'survey') {
              return null;
            }

            const q = questionnaires.get(task.questionnaireName);
            if (!q) return null;

            if (task.taskAccess.status === 'pending')
              return {
                questionnaireName: q.name,
                frequency: q.frequency,
                availableFrom: task.taskAccess.availableFrom.toISOString(),
              };
            else if (task.taskAccess.status === 'accessible') {
              if (q.frequency.type !== 'single' && q.frequency.type !== 'onDemand') {
                return { questionnaireName: q.name, frequency: q.frequency, availableFrom: null };
              }
            }
            return null;
          })
          .filter((notif): notif is NonNullable<typeof notif> => notif !== null);

        await fetch('/api/notifications/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            notifications: questionnaireNotifs,
            programName,
            clientTimestamp: new Date().toISOString(),
          }),
          signal: controller.signal,
        });
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') return;
        console.error('Failed to sync task notifications:', error);
      }
    }

    syncNotifications();

    return () => {
      controller.abort();
    };
  }, [allTasks, programName, state.data.status, programQuestionnaires]);

  const processedConsents = useMemo(() => {
    if (state.data.status !== 'success') return [];

    return Array.from(state.data.dashboardConsents.values()).filter((c) => c.accepted !== null);
  }, [state.data]);

  const updateConsent = useCallback((payload: Resource[]) => {
    dispatch({ type: 'UPDATE_CONSENT', payload });
  }, []);

  const submitQuestionnaire = useCallback((payload: Resource) => {
    dispatch({ type: 'SUBMIT_QUESTIONNAIRE', payload });
  }, []);

  const value = useMemo((): ProgramDashboardContextType => {
    return {
      state,
      allTasks,
      processedConsents,
      submitQuestionnaire,
      updateConsent,
    };
  }, [state, allTasks, processedConsents, updateConsent, submitQuestionnaire]);

  return (
    <ProgramDashboardContext.Provider value={value}>{children}</ProgramDashboardContext.Provider>
  );
}

export function useProgramDashboard() {
  const context = useContext(ProgramDashboardContext);
  if (!context)
    throw new Error('useProgramDashboard must be used within a ProgramDashboardProvider');
  return context;
}

export function useDashboardData(): DashboardWithData {
  const { state } = useProgramDashboard();
  const data = state.data;

  if (data.status !== 'success') {
    throw new Error(
      `[Dashboard] useDashboardData must be used within component, ` +
        `that render only, when valide data is loaded (Current status: ${data.status}).`,
    );
  }

  return data;
}
