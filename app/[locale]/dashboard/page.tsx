import type { Metadata } from 'next';
import { auth } from '@/auth';
import { getUserPrograms } from '@/lib/getUserPrograms';
import { getProgram } from '@/lib/getProgram';
import ProgramButton from './components/ProgramButton.client';
import ProgramSearchButton from './components/ProgramSearchButton.client';
import { SENSORHUB_BASE_PATH } from '@/lib/constants';
import { getTranslations } from 'next-intl/server';
import { resolveProgramLanguage } from '@/lib/getProgramLang';
import { Locale } from '@/i18n/config';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta.pageTitle' });
  return { title: t('dashboard') };
}

export default async function DashboardPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const session = await auth();

  const t = await getTranslations({ locale, namespace: 'dashboard' });

  const programIds = await getUserPrograms(session!.user!.id!);

  const programInfoPromises = programIds!.map(async (programId) => {
    const program = await getProgram(programId);
    const lang = await resolveProgramLanguage(program.languages, locale);
    return {
      programId,
      name: program.name,
      title: program.content.title[lang],
      image: program.content.image,
    };
  });
  const programs = await Promise.all(programInfoPromises);

  return (
    <main className="animate-slideUp relative container mx-auto px-4 py-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-12">
          <div className="fgrid grid-cols-[1fr_auto_1fr] items-center gap-4">
            <div />
            <h1 className="text-center text-4xl font-bold text-gray-900">{t('title')}</h1>

            <div className="flex justify-center py-2 sm:col-start-3 sm:justify-end">
              {programs.length !== 0 && (
                <ProgramSearchButton>
                  <span>{t('searchPrograms')}</span>
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </ProgramSearchButton>
              )}
            </div>
          </div>
        </div>

        {/* Programs List */}
        {programs.length === 0 ? (
          <div className="rounded-3xl border border-white/50 bg-white/90 p-12 text-center shadow-xl backdrop-blur-xl">
            <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-gray-100">
              <svg
                className="h-10 w-10 text-gray-400"
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
            <h3 className="mb-2 text-xl font-semibold text-gray-900">{t('noProgramsTitle')}</h3>
            <p className="mb-6 text-gray-500">
              {t.rich('noProgramsDescription', { br: () => <br /> })}
            </p>

            <ProgramSearchButton>
              <span>{t('searchPrograms')}</span>
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </ProgramSearchButton>
          </div>
        ) : (
          <div className="grid gap-4 md:gap-6">
            {programs.map((program) => (
              <ProgramButton key={program.programId} programId={program.programId}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {program.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={`${SENSORHUB_BASE_PATH}/static/programs/${program.programId}/images/${program.image}`}
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
                      <h3 className="mb-1 text-xl font-bold text-gray-900">{program.title}</h3>
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
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
