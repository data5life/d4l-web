import { getTranslations } from 'next-intl/server';
import { Locale } from '@/i18n/config';

export default async function ProgramEndedNotice({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'program' });

  return (
    <div
      className="mb-6 rounded-3xl border border-white/50 bg-white/90 p-8 shadow-xl backdrop-blur-xl"
      data-testid="program-ended-notice"
    >
      <h3 className="mb-4 text-xl font-semibold text-gray-900">{t('programEnded')}</h3>
      <div className="flex items-start gap-4 rounded-2xl border border-amber-100 bg-amber-50 p-5">
        <div className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-100">
          <svg
            className="h-4 w-4 text-amber-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <div>
          <p className="font-medium text-amber-800">{t('programEndedText')}</p>
          <p className="mt-1 text-sm text-amber-700">{t('contactTeam')}</p>
        </div>
      </div>
    </div>
  );
}
