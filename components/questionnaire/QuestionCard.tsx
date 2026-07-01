'use client';

import { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { Question } from '@/lib/questionnaireTypes';
import { useQuestionnaire } from './QuestionnaireProvider';
import { Button } from '@/components/ui/button';

interface QuestionCardProps {
  question: Question;
  children: ReactNode;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  canGoPrev: boolean;
  isLastQuestion: boolean;
  isAnswered: boolean;
  isValid: boolean;
  validationError: string | null;
}

export function QuestionCard({
  question,
  children,
  onNext,
  onPrev,
  onSkip,
  canGoPrev,
  isLastQuestion,
  isAnswered,
  isValid,
  validationError,
}: QuestionCardProps) {
  const t = useTranslations('common');
  const { hasCompletedOnce, complete } = useQuestionnaire();
  const canGoNext = isAnswered && isValid;

  return (
    <div className="mx-auto w-full max-w-2xl">
      {/* Question card */}
      <div className="shadow-card mb-6 rounded-3xl border border-violet-100/50 bg-white/80 p-8 backdrop-blur-sm md:p-10">
        {/* Required indicator */}
        {question.required && (
          <span className="mb-4 inline-flex items-center rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700">
            {t('required')}
          </span>
        )}
        {/* Question text */}
        <h2 className="mb-8 text-xl leading-relaxed font-semibold text-gray-800 md:text-2xl">
          {question.text}
        </h2>
        {/* Question input */}
        <div className="mb-2">{children}</div>
      </div>

      {/* Navigation buttons */}
      {hasCompletedOnce ? (
        <div className="flex items-center gap-3">
          {!question.required ? (
            <>
              {/* Leave Unanswered — only shown for non-required questions */}
              <Button
                type="button"
                onClick={onSkip}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-3.5 font-medium text-gray-500 shadow-sm transition-all duration-200 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700 hover:shadow-md active:scale-[0.98]"
              >
                <svg
                  className="h-4 w-4 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                {t('noAnswer')}
              </Button>

              {/* Back to Overview */}
              <Button
                type="button"
                onClick={complete}
                disabled={!canGoNext}
                className={`group flex flex-1 items-center justify-center gap-2 rounded-xl px-6 py-3.5 font-medium transition-all duration-200 active:scale-[0.98] ${
                  canGoNext
                    ? 'bg-gradient-to-r from-violet-600 to-violet-700 text-white shadow-sm hover:from-violet-700 hover:to-violet-800 hover:shadow-md'
                    : 'cursor-not-allowed bg-gray-100 text-gray-400'
                }`}
              >
                <svg
                  className="h-4 w-4 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                {t('overview')}
              </Button>
            </>
          ) : (
            /* Back to Overview — required question, spans full width */
            <Button
              type="button"
              onClick={complete}
              disabled={!canGoNext}
              className={`group flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3.5 font-medium transition-all duration-200 active:scale-[0.98] ${
                canGoNext
                  ? 'bg-gradient-to-r from-violet-600 to-violet-700 text-white shadow-sm hover:from-violet-700 hover:to-violet-800 hover:shadow-md'
                  : 'cursor-not-allowed bg-gray-100 text-gray-400'
              }`}
            >
              <svg
                className="h-4 w-4 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              {t('overview')}
            </Button>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3">
          {/* Back */}
          <Button
            type="button"
            onClick={onPrev}
            disabled={!canGoPrev}
            className={`group flex items-center gap-2 rounded-xl px-5 py-3.5 font-medium transition-all duration-200 active:scale-[0.98] ${
              canGoPrev
                ? 'bg-white text-gray-600 shadow-sm hover:bg-gray-50 hover:shadow-md'
                : 'cursor-not-allowed bg-gray-50 text-gray-300'
            }`}
          >
            <svg
              className={`h-4 w-4 shrink-0 transition-transform duration-200 ${canGoPrev ? 'group-hover:-translate-x-0.5' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            {t('back')}
          </Button>

          <div className="flex items-center gap-2">
            {/* Skip — only for non-required questions */}
            {!question.required && (
              <Button
                type="button"
                onClick={onSkip}
                className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-5 py-3.5 font-medium text-gray-500 shadow-sm transition-all duration-200 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700 hover:shadow-md active:scale-[0.98]"
              >
                {t('skip')}
                <svg
                  className="h-4 w-4 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Button>
            )}

            {/* Next / Complete */}
            <Button
              type="button"
              onClick={onNext}
              disabled={!canGoNext}
              className={`group flex items-center gap-2 rounded-xl px-7 py-3.5 font-medium transition-all duration-200 active:scale-[0.98] ${
                canGoNext
                  ? 'bg-gradient-to-r from-violet-600 to-violet-700 text-white shadow-sm hover:from-violet-700 hover:to-violet-800 hover:shadow-md'
                  : 'cursor-not-allowed bg-gray-100 text-gray-400'
              }`}
            >
              {isLastQuestion ? t('complete') : t('next')}
              <svg
                className={`h-4 w-4 shrink-0 transition-transform duration-200 ${canGoNext ? 'group-hover:translate-x-0.5' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Button>
          </div>
        </div>
      )}

      {/* Feedback messages */}
      {validationError && (
        <div className="mt-4 text-center">
          {/* Invalid value warning */}
          <p className="flex items-center justify-center gap-1.5 text-sm font-medium text-rose-500">
            <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            {validationError}
          </p>
        </div>
      )}
    </div>
  );
}
