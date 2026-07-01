'use client';
import SubmissionButton from './SubmissionButton.client';
import formatDate from '@/lib/formatDate';
import { useTranslations } from 'next-intl';
import ListCard from '@/components/ListCard.client';
import { useProgramDashboard } from '@/components/ProgramDashboardProvider';

export default function SubmissionsList() {
  const t = useTranslations('program');
  const { state } = useProgramDashboard();
  const data = state.data;

  const title = t('yourSubmissionsTitle');
  if (data.status === 'loading' || data.status === 'error') {
    return <ListCard title={title} isLoading />;
  }

  const submissions = data.resources
    .filter((r) => r.type === 'Questionnaire')
    .filter((s) => s.status === 'completed');
  const questionnaires = data.programQuestionnaires;
  const programId = state.program.name;

  return (
    <ListCard title={title}>
      {submissions.length === 0 ? (
        <div className="py-8 text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">
            <svg
              className="h-8 w-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <p className="text-gray-500">{t('noSubmissions')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {submissions.map((submission) => (
            <SubmissionButton
              key={submission.id}
              submissionId={submission.id}
              programId={programId}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="mb-2 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100 transition-colors group-hover:bg-violet-200">
                      <svg
                        className="h-5 w-5 text-violet-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {questionnaires.get(submission.questionnaire.name)!.title}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {t('submittedAt', {
                          date: formatDate(new Date(submission.createdAt), state.lang),
                        })}
                      </p>
                    </div>
                  </div>
                </div>
                <svg
                  className="h-5 w-5 text-gray-400 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-violet-600"
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
              </div>
            </SubmissionButton>
          ))}
        </div>
      )}
    </ListCard>
  );
}
