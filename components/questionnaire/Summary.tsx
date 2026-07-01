'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { Question, AnswerValue } from '@/lib/questionnaireTypes';
import { Program, SafeProgram } from '@/lib/programTypes';
import { getVisibleQuestions } from '@/lib/evaluateConditions';
import {
  DonationRecord,
  generateFHIRResponse,
  Program as D4LProgram,
  ResponseValue,
  ULIDtoUUID,
} from '@d4l/collect-lib';
import { ulid } from 'ulid';
import * as fhir5 from 'fhir/r5';
import { Button } from '@/components/ui/button';
import { Locale } from '@/i18n/config';
import { createDonationClient } from '@/lib/donation/create-client';
import { DashboardQuestionnaire, useProgramDashboard } from '../ProgramDashboardProvider';
import { AppAnswerItem, ResourceQuestionnaire } from '@/lib/types/resource';
import { calculateIteration } from '@/lib/iterationCalculator';

function parseAnswers(
  programName: string,
  questionnaire: DashboardQuestionnaire,
  visibleQuestions: Question[],
  responses: Record<string, AnswerValue>,
  oldSubmission: ResourceQuestionnaire | undefined,
  language: Locale,
): ResourceQuestionnaire {
  function formatAnswerAsArray(
    question: Question,
    answer: AnswerValue,
  ): ResponseValue | ResponseValue[] | undefined {
    if (answer === null || answer === undefined || answer === '') return undefined;
    switch (question.type) {
      case 'single-select': {
        const option = question.options.find((o) => o.value === answer)!;
        return { value: option.value, display: option.label, system: option.system };
      }

      case 'multi-select':
        return (answer as string[]).map((v) => {
          const option = question.options.find((o) => o.value === v)!;
          return { value: option.value, display: option.label, system: option.system };
        });

      default:
        return { value: String(answer) };
    }
  }
  const answers = visibleQuestions.map((question) => {
    const answer = responses[question.id];
    return {
      id: question.id,
      type: question.type,
      response: formatAnswerAsArray(question, answer),
      text: question.text,
    } as AppAnswerItem;
  });

  let createdAt = new Date();
  let id = ulid();
  if (oldSubmission) {
    id = oldSubmission.id;
    createdAt = new Date(oldSubmission.createdAt);
  }
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const iteration = calculateIteration(questionnaire.frequency, timeZone, createdAt);
  if (iteration.status !== 'active') throw new Error('Iteration out of bounds');

  return {
    status: 'completed',
    type: 'Questionnaire',
    language,
    answers,
    iteration: iteration.info,
    id,
    questionnaire: {
      name: questionnaire.name,
      url: questionnaire.url,
      version: questionnaire.version,
    },
    createdAt: createdAt.toISOString(),
    programName,
  };
}

interface SummaryProps {
  questionnaire: DashboardQuestionnaire;
  oldSubmission: ResourceQuestionnaire | undefined;
  answers: Record<string, AnswerValue>;
  lang: Locale;
  onEdit?: (index: number) => void;
  onReset?: () => void;
  program: SafeProgram;
  isReadOnly: boolean;
}

export function Summary({
  questionnaire,
  oldSubmission,
  answers,
  lang,
  onEdit,
  onReset,
  program,
  isReadOnly,
}: SummaryProps) {
  const t = useTranslations('common');
  const q = useTranslations('questionnaire');
  const p = useTranslations('program');
  const {
    state: { did },
    submitQuestionnaire,
  } = useProgramDashboard();
  const router = useRouter();
  const visibleQuestions = getVisibleQuestions(questionnaire!.questions, answers);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const programName = program.name;

  const formatAnswer = (question: Question, answer: AnswerValue): string => {
    if (answer === null || answer === undefined || answer === '') return '—';
    switch (question.type) {
      case 'single-select': {
        const singleOption = question.options.find((o) => o.value === answer);
        return singleOption?.label || String(answer);
      }

      case 'multi-select':
        if (Array.isArray(answer)) {
          return answer
            .map((v) => question.options.find((o) => o.value === v)?.label || v)
            .join(', ');
        }
        return String(answer);
      case 'date': {
        if (typeof answer !== 'string' || !answer) return String(answer);
        const d = new Date(answer);
        if (isNaN(d.getTime())) return answer;
        return new Intl.DateTimeFormat(undefined, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }).format(d);
      }

      default:
        return String(answer);
    }
  };

  const handleSubmit = async () => {
    if (isReadOnly) {
      return;
    }
    setIsSubmitting(true);
    try {
      const response = parseAnswers(
        programName,
        questionnaire,
        visibleQuestions,
        answers,
        oldSubmission,
        lang,
      );
      const client = createDonationClient();

      const resources: fhir5.Resource[] = [generateFHIRResponse(response.id, response)];

      const records: DonationRecord[] = resources.map((document) => {
        return {
          id: ULIDtoUUID(document.id!),
          status: 'Active',
          document,
        };
      });
      // Upload
      await client.donate(did, program as Program as D4LProgram, records);
      submitQuestionnaire(response);
    } catch {
      setNotification({ type: 'error', message: t('submitError') });
    } finally {
      setIsSubmitting(false);
      router.push(`/dashboard/program/${programName}`);
    }
  };

  return (
    <div className="animate-slideUp mx-auto w-full max-w-2xl">
      {/* Notification */}
      {notification && (
        <div
          className={`animate-slideDown fixed top-4 right-4 z-50 rounded-xl border px-6 py-4 shadow-lg ${
            notification.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-rose-200 bg-rose-50 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-3">
            <p className="font-medium">{notification.message}</p>
            <Button
              variant="ghost"
              onClick={() => setNotification(null)}
              className="ml-2 rounded-md p-1 hover:opacity-70"
            >
              ✕
            </Button>
          </div>
        </div>
      )}

      {isReadOnly && (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <p className="font-medium">{q('readonlyBannerTitle')}</p>
          <p className="mt-1">{q('readonlyBannerBody') + ' ' + p('contactTeam')}</p>
        </div>
      )}

      {visibleQuestions.map((question, index) => {
        const answer = answers[question.id];
        return (
          <div
            key={question.id}
            className="group px-8 py-6 transition-colors duration-200 hover:bg-violet-50/50"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="mb-1.5 text-xs font-medium tracking-wider text-violet-600 uppercase">
                  {q('questionLabel', { number: index + 1 })}
                </p>
                <p className="mb-2 leading-relaxed font-medium text-gray-800">{question.text}</p>
                <p className="text-gray-600">{formatAnswer(question, answer)}</p>
              </div>
              {!isReadOnly && onEdit && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(index)}
                  className="shrink-0 px-4 py-2 text-sm font-medium text-violet-600 hover:bg-violet-100 hover:text-violet-700"
                >
                  {t('edit')}
                </Button>
              )}
            </div>
          </div>
        );
      })}

      {/* Actions */}
      {!isReadOnly && onReset && (
        <div className="flex flex-col gap-4 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={onReset}
            className="shadow-soft h-auto flex-1 rounded-xl border-0 bg-white px-6 py-4 text-base font-medium text-gray-600 hover:bg-gray-50"
          >
            {t('startOver')}
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            size="lg"
            className="h-auto flex-1 rounded-xl bg-linear-to-r from-emerald-500 to-emerald-600 px-6 py-4 text-base font-medium text-white shadow-lg hover:from-emerald-600 hover:to-emerald-700"
          >
            {isSubmitting ? t('submitting') : t('submitAnswers')}
          </Button>
        </div>
      )}
    </div>
  );
}
