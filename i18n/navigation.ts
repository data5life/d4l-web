import { createNavigation } from 'next-intl/navigation';
import { defaultLocale, localePrefix, locales } from './config';

/** @public */
export const { Link, redirect, usePathname, useRouter } = createNavigation({
  locales,
  defaultLocale,
  localePrefix,
});
