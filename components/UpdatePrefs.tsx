'use client';

import { useRouter } from '@/i18n/navigation';
import { useSession } from 'next-auth/react';
import { useLocale } from 'next-intl';
import { useEffect } from 'react';

export default function UpdatePrefs() {
  const { data: session } = useSession();
  const locale = useLocale();
  const router = useRouter();

  useEffect(() => {
    if (!session?.user) return;
    if (document.visibilityState !== 'visible') return;

    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    fetch('/api/user/update-prefs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ timeZone, locale }),
    });
  }, [router, session, locale]);

  return null;
}
