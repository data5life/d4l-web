import { ReactNode } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { locales } from '@/i18n/config';
import Providers from './providers';
import { SessionProvider } from 'next-auth/react';
import UpdatePrefs from '@/components/UpdatePrefs';
import TopBar from '@/components/TopBar.client';
import { auth } from '@/auth';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta' });
  return {
    title: {
      template: `%s - D4L Collect`,
      default: 'D4L Collect',
    },
    description: t('description'),
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!locales.includes(locale as (typeof locales)[number])) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = (await import(`../../messages/${locale}.json`)).default;

  const session = await auth();

  return (
    <html lang={locale}>
      <body className="min-h-screen">
        {/* Decorative elements */}
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute top-0 right-0 h-[500px] w-[500px] rounded-full bg-gradient-to-bl from-violet-200/20 to-transparent blur-3xl" />
          <div className="absolute bottom-0 left-0 h-[500px] w-[500px] rounded-full bg-gradient-to-tr from-purple-200/20 to-transparent blur-3xl" />
        </div>
        <SessionProvider>
          <Providers locale={locale} messages={messages}>
            <UpdatePrefs />
            {session && session.user && <TopBar userName={session.user.name} />}
            {children}
          </Providers>
        </SessionProvider>
      </body>
    </html>
  );
}
