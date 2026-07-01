'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { Task } from '@/lib/evaluateTasks';
import { ConsentPopup } from './ConsentPopup.client';
import formatDate from '@/lib/formatDate';
import {
  DashboardConsent,
  useDashboardData,
  useProgramDashboard,
} from '@/components/ProgramDashboardProvider';
import { Button } from '@/components/ui/button';

interface Props {
  task: Task;
}

export default function TaskListButton({ task }: Props) {
  const t = useTranslations('program');
  const common = useTranslations('common');
  const { state } = useProgramDashboard();
  const data = useDashboardData();

  const programId = state.program.name;

  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [pendingConsent, setPendingConsent] = useState<DashboardConsent | null>(null);

  const navigateToQuestionnaire = (questionnaireName: string) => {
    router.push(
      `/dashboard/program/${encodeURIComponent(programId)}/questionnaire/${encodeURIComponent(questionnaireName)}`,
    );
  };

  const handleClick = () => {
    // show the popup directly
    if (task.type === 'consent') {
      const c = data.dashboardConsents.get(task.consentKey);
      setPendingConsent(c!);
      return;
    }
    if (task.type === 'survey') {
      navigateToQuestionnaire(task.questionnaireName);
    }
  };

  const getTaskName = (taskStep: Task) => {
    if (taskStep.type === 'survey') {
      const surveyId = taskStep.questionnaireName;
      return data.programQuestionnaires.get(surveyId)!.title;
    }
    if (taskStep.type === 'consent') {
      const consentKey = taskStep.consentKey;
      return data.dashboardConsents.get(consentKey)!.title[state.lang];
    }
    return t('fillOutQuestionnaire');
  };

  const isAccessible = task.taskAccess.status === 'accessible';

  return (
    <>
      {pendingConsent && (
        <ConsentPopup
          isOpen={true}
          closePopup={() => {
            setPendingConsent(null);
            setLoading(false);
          }}
          consent={pendingConsent}
          programId={programId}
        />
      )}
      <Button
        onClick={isAccessible ? handleClick : undefined}
        disabled={loading || !isAccessible}
        className={`group block h-auto w-full rounded-xl border p-4 text-left whitespace-normal transition-all duration-200 ${
          isAccessible
            ? 'border-gray-200 bg-white hover:border-violet-300 hover:bg-gray-50 hover:shadow-md disabled:cursor-wait disabled:opacity-60'
            : 'cursor-default border-gray-200 bg-gray-50'
        }`}
      >
        <div className={`flex items-center justify-between ${isAccessible ? '' : 'opacity-50'}`}>
          <div className="flex items-center gap-4">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-xl transition-colors duration-200 ${
                isAccessible ? 'bg-violet-100 group-hover:bg-violet-200' : 'bg-gray-100'
              }`}
            >
              <svg
                className={`h-6 w-6 ${isAccessible ? 'text-violet-600' : 'text-gray-400'}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isAccessible ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                )}
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className={`font-semibold ${isAccessible ? 'text-gray-900' : 'text-gray-400'}`}>
                  {getTaskName(task)}
                </h4>
                {task.required && (
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      isAccessible ? 'bg-violet-100 text-violet-700' : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {common('required')}
                  </span>
                )}
              </div>
              {task.taskAccess.status === 'pending' && (
                <p className="mt-1 text-sm text-amber-600">
                  {t('availableFrom', {
                    date: formatDate(task.taskAccess.availableFrom, state.lang),
                  })}
                </p>
              )}
              {isAccessible &&
                task.type === 'consent' &&
                data.dashboardConsents.get(task.consentKey)!.published && (
                  <p className="text-sm text-gray-500">
                    {t('publishedAt', {
                      date: formatDate(
                        new Date(data.dashboardConsents.get(task.consentKey)!.published!),
                        state.lang,
                      ),
                    })}
                  </p>
                )}
            </div>
          </div>
          {isAccessible && (
            <svg
              className="h-5 w-5 text-gray-400 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-violet-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          )}
        </div>
      </Button>
    </>
  );
}
