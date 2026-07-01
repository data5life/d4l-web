function resolveLocale(selectedLang: string): string {
  const browserLocales = navigator.languages || [navigator.language];
  const match = browserLocales.find((locale) => locale.startsWith(selectedLang));

  if (match) return match;

  const fallbacks: Record<string, string> = {
    en: 'en-GB',
    de: 'de-DE',
  };

  return fallbacks[selectedLang] || selectedLang;
}

export default function formatDate(date: Date, lang: string, timeZone?: string) {
  return new Intl.DateTimeFormat(resolveLocale(lang), {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: timeZone,
  }).format(date);
}
