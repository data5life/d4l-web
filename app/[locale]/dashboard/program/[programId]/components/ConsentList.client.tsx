'use client';

import ConsentButton from './ConsentButton.client';
import formatDate from '@/lib/formatDate';
import { useTranslations } from 'next-intl';
import ListCard from '@/components/ListCard.client';
import { useProgramDashboard } from '@/components/ProgramDashboardProvider';

export default function ConsentList() {
  const t = useTranslations('program');
  const { state, processedConsents: consents } = useProgramDashboard();
  const lang = state.lang;
  const data = state.data;

  const title = t('yourConsentsTitle');
  if (data.status === 'loading' || data.status === 'error') {
    return <ListCard title={title} isLoading />;
  }

  return (
    <ListCard title={title}>
      {consents.length === 0 ? (
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
          <p className="text-gray-500">{t('noConsents')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {consents.map((consent) => (
            <ConsentButton key={consent.name} consent={consent} programId={consent.programName}>
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
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-gray-900">{consent.title[lang]}</h4>
                      </div>
                      <p className="text-sm text-gray-500">
                        {consent.published &&
                          t('publishedAt', {
                            date: formatDate(new Date(consent.published), lang),
                          })}
                      </p>
                      <p className="text-sm text-gray-500">
                        {consent.updatedAt &&
                          (consent.accepted
                            ? t('acceptedAt', {
                                date: formatDate(new Date(consent.updatedAt), lang),
                              })
                            : t('declinedAt', {
                                date: formatDate(new Date(consent.updatedAt), lang),
                              }))}
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
            </ConsentButton>
          ))}
        </div>
      )}
    </ListCard>
  );
}
