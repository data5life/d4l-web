export const locales = ['en', 'de'] as const;
export type Locale = (typeof locales)[number];

/** @public */
export const localeNames: Record<Locale, string> = {
  en: 'English',
  de: 'Deutsch',
};

export const defaultLocale: Locale = 'en';
export const localePrefix: 'never' | 'always' | 'as-needed' = 'always';

export const defaultTimeZone = 'Europe/Berlin';
