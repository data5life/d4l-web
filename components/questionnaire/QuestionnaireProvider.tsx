'use client';

import { createContext, useContext, useReducer, useMemo, useCallback, ReactNode } from 'react';
import {
  QuestionnaireState,
  QuestionnaireAction,
  AnswerValue,
  Question,
} from '@/lib/questionnaireTypes';
import { getVisibleQuestions } from '@/lib/evaluateConditions';
import { DashboardQuestionnaire } from '../ProgramDashboardProvider';
import { ResourceQuestionnaire } from '@/lib/types/resource';

export type QuestionnaireMode = 'new' | 'submission';

function questionnaireReducer(
  state: QuestionnaireState,
  action: QuestionnaireAction,
): QuestionnaireState {
  switch (action.type) {
    case 'SET_ANSWER':
      return {
        ...state,
        answers: {
          ...state.answers,
          [action.payload.questionId]: action.payload.value,
        },
      };
    case 'NEXT_QUESTION':
      return { ...state, currentIndex: state.currentIndex + 1 };
    case 'PREV_QUESTION':
      return { ...state, currentIndex: Math.max(0, state.currentIndex - 1) };
    case 'GO_TO_QUESTION':
      return { ...state, currentIndex: action.payload, isComplete: false };
    case 'COMPLETE':
      return { ...state, isComplete: true, hasCompletedOnce: true };
    case 'RESET':
      return { answers: {}, currentIndex: 0, isComplete: false, hasCompletedOnce: false };
    case 'RESTORE_ANSWERS':
      return {
        ...state,
        answers: action.payload.answers,
        isComplete: true,
        hasCompletedOnce: true,
      };

    default:
      const _exhaustiveCheck: never = action;
      return state;
  }
}

interface QuestionnaireContextType {
  state: QuestionnaireState;
  questionnaire: DashboardQuestionnaire;
  oldSubmission: ResourceQuestionnaire | undefined;
  mode: QuestionnaireMode;
  visibleQuestions: Question[];
  currentQuestion: Question | null;
  progress: { current: number; total: number; percentage: number };
  setAnswer: (questionId: string, value: AnswerValue) => void;
  nextQuestion: () => void;
  prevQuestion: () => void;
  goToQuestion: (index: number) => void;
  complete: () => void;
  reset: () => void;
  canGoNext: boolean;
  canGoPrev: boolean;
  isLastQuestion: boolean;
  hasCompletedOnce: boolean;
}

const QuestionnaireContext = createContext<QuestionnaireContextType | null>(null);

type QuestionnaireProviderProps = {
  children: ReactNode;
  questionnaire: DashboardQuestionnaire;
} & (
  | {
      mode: 'new';
    }
  | {
      mode: 'submission';
      submission: ResourceQuestionnaire;
      initialAnswers: Record<string, AnswerValue>;
    }
);

export function QuestionnaireProvider(props: QuestionnaireProviderProps) {
  const { children, mode, questionnaire } = props;
  const initialState: QuestionnaireState =
    props.mode === 'submission'
      ? {
          answers: props.initialAnswers,
          currentIndex: 0,
          isComplete: true,
          hasCompletedOnce: true,
        }
      : {
          answers: {},
          currentIndex: 0,
          isComplete: false,
          hasCompletedOnce: false,
        };

  const [state, dispatch] = useReducer(questionnaireReducer, initialState);

  const visibleQuestions = useMemo(() => {
    return getVisibleQuestions(questionnaire.questions, state.answers);
  }, [questionnaire.questions, state.answers]);

  const currentQuestion = useMemo(
    () => visibleQuestions[state.currentIndex] || null,
    [visibleQuestions, state.currentIndex],
  );

  // Progress calculation
  const progress = useMemo(() => {
    const total = visibleQuestions.length;
    const current = Math.min(state.currentIndex + 1, total);
    const percentage = total > 0 ? (current / total) * 100 : 0;
    return { current, total, percentage };
  }, [visibleQuestions.length, state.currentIndex]);

  // Navigation helpers
  const canGoPrev = state.currentIndex > 0;
  const canGoNext = state.currentIndex < visibleQuestions.length - 1;
  const isLastQuestion = state.currentIndex === visibleQuestions.length - 1;
  const hasCompletedOnce = state.hasCompletedOnce ?? false;

  const setAnswer = useCallback(
    (questionId: string, value: AnswerValue) =>
      dispatch({ type: 'SET_ANSWER', payload: { questionId, value } }),
    [],
  );
  const nextQuestion = useCallback(() => dispatch({ type: 'NEXT_QUESTION' }), []);
  const prevQuestion = useCallback(() => dispatch({ type: 'PREV_QUESTION' }), []);
  const goToQuestion = useCallback(
    (index: number) => dispatch({ type: 'GO_TO_QUESTION', payload: index }),
    [],
  );
  const complete = useCallback(() => dispatch({ type: 'COMPLETE' }), []);
  const reset = useCallback(() => dispatch({ type: 'RESET' }), []);

  const oldSubmission = props.mode === 'submission' ? props.submission : undefined;
  const value = useMemo(
    () => ({
      state,
      mode,
      visibleQuestions,
      currentQuestion,
      progress,
      setAnswer,
      nextQuestion,
      prevQuestion,
      goToQuestion,
      complete,
      reset,
      canGoNext,
      canGoPrev,
      isLastQuestion,
      hasCompletedOnce,
      questionnaire,
      oldSubmission,
    }),
    [
      state,
      mode,
      visibleQuestions,
      currentQuestion,
      progress,
      setAnswer,
      nextQuestion,
      prevQuestion,
      goToQuestion,
      complete,
      reset,
      canGoNext,
      canGoPrev,
      isLastQuestion,
      hasCompletedOnce,
      questionnaire,
      oldSubmission,
    ],
  );
  return <QuestionnaireContext.Provider value={value}>{children}</QuestionnaireContext.Provider>;
}

export function useQuestionnaire() {
  const context = useContext(QuestionnaireContext);
  if (!context) throw new Error('useQuestionnaire must be used within a QuestionnaireProvider');
  return context;
}
