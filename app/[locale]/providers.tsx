'use client';

import { ReactNode } from 'react';
import { AbstractIntlMessages, NextIntlClientProvider } from 'next-intl';
import { defaultTimeZone } from '@/i18n/config';

interface ProvidersProps {
  children: ReactNode;
  messages: AbstractIntlMessages;
  locale: string;
}

export default function Providers({ children, messages, locale }: ProvidersProps) {
  return (
    <NextIntlClientProvider locale={locale} messages={messages} timeZone={defaultTimeZone}>
      {children}
    </NextIntlClientProvider>
  );
}
