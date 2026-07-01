import type { Metadata } from 'next';
import ExportDataButton from './components/ExportDataButton.client';
import DeleteAccountButton from './components/DeleteAccountButton.client';
import { getTranslations } from 'next-intl/server';
import RecoveryKeySection from './components/RecoveryKeySection';
import NotificationsCard, { ProgramRow } from './components/NotificationsCard.client';
import { auth } from '@/auth';
import { User } from '@prisma/client';
import { Record } from '@prisma/client/runtime/client';
import { Locale } from '@/i18n/config';
import { prisma } from '@/lib/prisma';
import { getProgram } from '@/lib/getProgram';
import { resolveProgramLanguage } from '@/lib/getProgramLang';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta.pageTitle' });
  return { title: t('settings') };
}

export default async function SettingsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    console.error('Only a authenitcated user can visit the settings page.');
    return null;
  }
  const recoverKey = (session.user as User).recoveryKey as Record<number, number>;
  const r = recoverKey ? Object.values(recoverKey) : null;

  const t = await getTranslations({ locale, namespace: 'settings' });
  const userRecord = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      notificationsEnabled: true,
      notificationPreferences: { select: { programId: true, enabled: true } },
      enrollments: { select: { programId: true } },
    },
  });

  const initialPerProgram: Record<string, boolean> = {};
  for (const pref of userRecord?.notificationPreferences ?? []) {
    initialPerProgram[pref.programId] = pref.enabled;
  }

  const enrolledProgramIds = (userRecord?.enrollments ?? []).map((e) => e.programId);

  const programs: ProgramRow[] = await Promise.all(
    enrolledProgramIds.map(async (programId) => {
      try {
        const program = await getProgram(programId);
        const lang = resolveProgramLanguage(program.languages, locale);
        return { programId, title: program.content.title[lang] ?? programId };
      } catch {
        return { programId, title: programId };
      }
    }),
  );
  programs.sort((a, b) => a.title.localeCompare(b.title));

  return (
    <main className="animate-slideUp relative container mx-auto px-4">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="mb-3 text-4xl font-bold text-gray-900">{t('title')}</h1>
          <p className="text-lg text-gray-600">{t('subtitle')}</p>
        </div>

        {/* Your Data Section */}
        <div className="mb-6 rounded-3xl border border-white/50 bg-white/90 p-8 shadow-xl backdrop-blur-xl">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100">
              <svg
                className="h-6 w-6 text-violet-600"
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
            <h2 className="text-2xl font-bold text-gray-900">{t('yourDataTitle')}</h2>
          </div>

          <p className="mb-6 text-gray-600">{t('yourDataDescription')}</p>

          <ul className="mb-6 space-y-3">
            <li className="flex items-start gap-3">
              <svg
                className="mt-0.5 h-5 w-5 flex-shrink-0 text-violet-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <span className="font-medium text-gray-900">{t('profileInfoTitle')}</span>
                <p className="text-sm text-gray-500">{t('profileInfoDescription')}</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <svg
                className="mt-0.5 h-5 w-5 flex-shrink-0 text-violet-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <span className="font-medium text-gray-900">
                  {t('questionnaireResponsesTitle')}
                </span>
                <p className="text-sm text-gray-500">{t('questionnaireResponsesDescription')}</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <svg
                className="mt-0.5 h-5 w-5 flex-shrink-0 text-violet-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <span className="font-medium text-gray-900">{t('consentRecordsTitle')}</span>
                <p className="text-sm text-gray-500">{t('consentRecordsDescription')}</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <svg
                className="mt-0.5 h-5 w-5 flex-shrink-0 text-violet-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <span className="font-medium text-gray-900">{t('linkedAccountsTitle')}</span>
                <p className="text-sm text-gray-500">{t('linkedAccountsDescription')}</p>
              </div>
            </li>
          </ul>
        </div>

        {/* Recovery Key Section */}
        <div className="mb-6 rounded-3xl border border-white/50 bg-white/90 p-8 shadow-xl backdrop-blur-xl">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100">
              <svg
                className="h-6 w-6 text-amber-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">{t('recoveryKeyTitle')}</h2>
          </div>

          <p className="mb-6 text-gray-600">{t('recoveryKeyDescription')}</p>

          <RecoveryKeySection recoveryKey={r} locale={locale as Locale} />
        </div>
        {/* Notifications Section */}
        <NotificationsCard
          initialGlobalEnabled={userRecord?.notificationsEnabled ?? true}
          initialPerProgram={initialPerProgram}
          programs={programs}
        />

        {/* Export Data Section */}
        <div className="mb-6 rounded-3xl border border-white/50 bg-white/90 p-8 shadow-xl backdrop-blur-xl">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
              <svg
                className="h-6 w-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">{t('exportDataTitle')}</h2>
          </div>

          <p className="mb-6 text-gray-600">{t('exportDescription')}</p>

          <ExportDataButton />
        </div>

        {/* Delete Account Section */}
        <div className="rounded-3xl border border-red-100 bg-white/90 p-8 shadow-xl backdrop-blur-xl">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100">
              <svg
                className="h-6 w-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">{t('deleteAccountTitle')}</h2>
          </div>

          <p className="mb-2 text-gray-600">{t('deleteDescription')}</p>

          <p className="mb-6 text-sm text-red-600">{t('deleteWarning')}</p>

          <DeleteAccountButton />
        </div>
      </div>
    </main>
  );
}
