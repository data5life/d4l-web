import createMiddleware from 'next-intl/middleware';
import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import { defaultLocale, localePrefix, locales } from './i18n/config';
import { User } from '@prisma/client';

const handleI18nRouting = createMiddleware({
  locales,
  defaultLocale,
  localePrefix,
  localeDetection: true,
});

export default auth((req) => {
  const { nextUrl, auth: session } = req;
  const isLoggedIn = !!session;
  const onboardingComplete = (req.auth?.user as User)?.recoveryKey !== null;
  const { origin, pathname, searchParams } = req.nextUrl;

  const localePattern = new RegExp(`^/(${locales.join('|')})(/|$)`);
  const barePathname = pathname.replace(localePattern, '/');

  const isPrivate = barePathname.startsWith('/dashboard');
  const isOnboardingPage = barePathname === '/onboarding';

  if (!isLoggedIn && isPrivate) {
    const locale = nextUrl.pathname.match(localePattern)?.[1] ?? defaultLocale;
    const url = new URL(`/${locale}/login`, origin);
    url.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(url);
  }

  if (isLoggedIn) {
    if (!onboardingComplete && !isOnboardingPage) {
      const url = new URL('/onboarding', origin);
      url.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(url);
    } else if ((onboardingComplete && isOnboardingPage) || barePathname === '/login') {
      const callbackUrl = searchParams.get('callbackUrl');
      const target = callbackUrl ? decodeURIComponent(callbackUrl) : '/dashboard';
      return NextResponse.redirect(new URL(target, req.url));
    } else if (barePathname === '/' || barePathname === '') {
      const locale = nextUrl.pathname.match(localePattern)?.[1] ?? defaultLocale;
      return NextResponse.redirect(new URL(`/${locale}/dashboard`, origin));
    }
  }
  return handleI18nRouting(req);
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
