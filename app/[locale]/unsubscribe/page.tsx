import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { verifyUnsubscribeToken } from '@/lib/unsubscribeToken';
import { getProgram } from '@/lib/getProgram';
import { resolveProgramLanguage } from '@/lib/getProgramLang';
import { getTranslations } from 'next-intl/server';
import UnsubscribeActions from './UnsubscribeActions.client';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta.pageTitle' });
  return { title: t('unsubscribe') };
}

export default async function UnsubscribePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { locale } = await params;
  const { token } = await searchParams;
  const t = await getTranslations({ locale, namespace: 'unsubscribe' });

  if (!token) {
    return (
      <Layout title={t('invalidTitle')}>
        <p className="text-center text-gray-600">{t('invalidToken')}</p>
      </Layout>
    );
  }

  const payload = verifyUnsubscribeToken(token);
  if (!payload) {
    return (
      <Layout title={t('invalidTitle')}>
        <p className="text-center text-gray-600">{t('invalidToken')}</p>
      </Layout>
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, email: true, notificationsEnabled: true },
  });
  if (!user) {
    return (
      <Layout title={t('invalidTitle')}>
        <p className="text-center text-gray-600">{t('invalidToken')}</p>
      </Layout>
    );
  }

  // Disable reminders for this program on landing — same effect as the RFC
  // 8058 one-click POST endpoint. The page then renders the (off) state in
  // a toggle the user can flip back on.
  await prisma.notificationPreference.upsert({
    where: {
      userId_programId: { userId: user.id, programId: payload.programId },
    },
    create: { userId: user.id, programId: payload.programId, enabled: false },
    update: { enabled: false },
  });

  let programTitle = payload.programId;
  try {
    const program = await getProgram(payload.programId);
    const lang = resolveProgramLanguage(program.languages, locale);
    programTitle = program.content.title[lang] ?? payload.programId;
  } catch {
    notFound();
  }

  return (
    <Layout title={t('title')} subtitle={t('sentTo', { email: user.email })} bellOff>
      <UnsubscribeActions
        token={token}
        programTitle={programTitle}
        initialEnabled={false}
        initialGlobalDisabled={!user.notificationsEnabled}
      />
    </Layout>
  );
}

function Layout({
  title,
  subtitle,
  bellOff,
  children,
}: {
  title: string;
  subtitle?: string;
  bellOff?: boolean;
  children: React.ReactNode;
}) {
  return (
    <main className="animate-slideUp relative container mx-auto px-4 py-12">
      <div className="mx-auto max-w-xl rounded-3xl border border-white/50 bg-white/90 p-8 shadow-xl backdrop-blur-xl">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
            <svg
              className="h-7 w-7 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {bellOff ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9M3 3l18 18"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              )}
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
        </div>
        {children}
      </div>
    </main>
  );
}
