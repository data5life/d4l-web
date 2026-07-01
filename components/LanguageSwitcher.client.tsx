'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useLocale, useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { usePathname, useRouter } from '@/i18n/navigation';

export default function LanguageSwitcher() {
  const locale = useLocale();
  const t = useTranslations('language');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleChange = (nextLocale: string) => {
    const params = searchParams.toString();
    const href = params ? `${pathname}?${params}` : pathname;
    router.push(href, { locale: nextLocale });
  };

  const languageLabel = locale === 'de' ? 'Deutsch' : 'English';

  return (
    <Select value={locale} onValueChange={handleChange}>
      <SelectTrigger
        aria-label={t('label')}
        className="h-auto min-w-0 cursor-pointer border-0 bg-transparent py-2 pr-2 pl-3 text-sm font-medium text-gray-600 shadow-none transition-colors hover:bg-transparent hover:text-gray-900 focus-visible:ring-0"
      >
        <SelectValue>{languageLabel}</SelectValue>
      </SelectTrigger>
      <SelectContent sideOffset={8}>
        <SelectItem value="en">English</SelectItem>
        <SelectItem value="de">Deutsch</SelectItem>
      </SelectContent>
    </Select>
  );
}
