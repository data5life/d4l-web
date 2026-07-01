import { getPublicPrograms } from '@/lib/getPublicPrograms';
import ProgramButton from '../dashboard/components/ProgramButton.client';
import ProgramSearch from './components/ProgramSearch.client';
import { getTranslations } from 'next-intl/server';
import { SENSORHUB_BASE_PATH } from '@/lib/constants';
import { resolveProgramLanguage } from '@/lib/getProgramLang';
import { Locale } from '@/i18n/config';
import ListCard from '@/components/ListCard.client';

export default async function SearchPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const programs = await getPublicPrograms(true);
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'search' });

  return (
    <main className="animate-slideUp relative container mx-auto px-4 py-24">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="mb-3 text-4xl font-bold text-gray-900">{t('title')}</h1>
        </div>

        {/*Search for Program */}
        <div className="mb-12 text-center">
          <ProgramSearch />
        </div>

        {/* Programs List */}
        <ListCard title={t('publicProgramsTitle')}>
          {programs.length === 0 ? (
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
              <p className="text-gray-500">{t('noPublicPrograms')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {programs.map((program) => {
                const programLanguage = resolveProgramLanguage(program.languages, locale);
                return (
                  <ProgramButton key={program.name} programId={program.name}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {program.content.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={`${SENSORHUB_BASE_PATH}/static/programs/${program.name}/images/${program.content.image}`}
                            alt=""
                            className="h-14 w-14 rounded-xl object-cover shadow-lg"
                          />
                        ) : (
                          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-linear-to-br from-violet-500 to-violet-600 shadow-lg">
                            <svg
                              className="h-7 w-7 text-white"
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
                        )}
                        <div>
                          <h3 className="mb-1 text-xl font-bold text-gray-900">
                            {program.content.title[programLanguage]}
                          </h3>
                        </div>
                      </div>
                      <svg
                        className="h-6 w-6 text-gray-400 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-violet-600"
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
                  </ProgramButton>
                );
              })}
            </div>
          )}
        </ListCard>
      </div>
    </main>
  );
}
