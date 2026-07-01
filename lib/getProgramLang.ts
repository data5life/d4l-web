import { Locale } from '@/i18n/config';

export function resolveProgramLanguage(
  supportedLanguages: Locale[],
  preferredLanguage: string,
): Locale {
  if ((supportedLanguages as string[]).includes(preferredLanguage)) {
    return preferredLanguage as Locale;
  }
  // If the preferred language is not available try to default to English
  if (supportedLanguages.includes('en')) return 'en';
  return supportedLanguages[0];
}
