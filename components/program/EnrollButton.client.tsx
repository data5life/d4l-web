'use client';

import { Program as D4LProgram } from '@d4l/collect-lib';
import { Program } from '@/lib/programTypes';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { createDonationClient } from '@/lib/donation/create-client';
import { createDonor } from '@/lib/donation/get-donor';
import { Button } from '../ui/button';
import { useRouter } from '@/i18n/navigation';

interface Props {
  program: Program;
  recoveryKey: Uint8Array | null;
  isGuest: boolean;
}

export default function EnrollButton({ program, recoveryKey, isGuest }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const t = useTranslations('program');

  async function handleEnroll() {
    setLoading(true);

    const client = createDonationClient();

    const { donorIdentity, subjectId } = await createDonor(
      client,
      program as D4LProgram,
      undefined,
      recoveryKey!,
    );

    await fetch(`/api/dashboard/programs/${program.name}/enrollment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        donorIdentity,
        subjectId,
      }),
    });
    router.push(`/dashboard/program/${program.name}`);
    setLoading(false);
  }

  if (isGuest) {
    return (
      <Button
        onClick={() => router.push(`/login?callbackUrl=/program/${program.name}`)}
        disabled={loading}
        className="rounded-lg bg-violet-600 px-6 py-3 font-medium text-white transition-colors hover:bg-violet-700 disabled:opacity-50"
      >
        {t('loginToEnroll')}
      </Button>
    );
  }

  return (
    <Button
      onClick={handleEnroll}
      disabled={loading}
      className="rounded-lg bg-violet-600 px-6 py-3 font-medium text-white transition-colors hover:bg-violet-700 disabled:opacity-50"
    >
      {loading ? t('enrolling') : t('enroll')}
    </Button>
  );
}
