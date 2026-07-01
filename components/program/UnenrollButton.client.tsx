'use client';

import { Program as D4LProgram, DonationRecord, ULIDtoUUID } from '@d4l/collect-lib';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { createDonationClient } from '@/lib/donation/create-client';
import { useRouter } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { DashboardSuccessData, useProgramDashboard } from '../ProgramDashboardProvider';
import { updateOrCreateResearchSubject } from '@/lib/donation/upsert-resources';
import { resourcesToFHIR } from '@/lib/fhir-parser/resource';
import { Program } from '@/lib/programTypes';

export default function UnenrollButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const t = useTranslations('program');
  const { state } = useProgramDashboard();
  const program = state.program;

  const isButtonDisabled = loading || state?.data?.status !== 'success';
  async function confirmUnenroll() {
    setLoading(true);
    const data = state.data as DashboardSuccessData;

    const did = state.did;
    const client = createDonationClient();
    const subjectResource = updateOrCreateResearchSubject(
      data.resources,
      program.name,
      undefined,
      'off-study',
      new Date().toISOString(),
    );

    const resourcesFHIR = resourcesToFHIR([subjectResource]);
    const records: DonationRecord[] = resourcesFHIR.map((document) => {
      return {
        id: ULIDtoUUID(document.id!),
        status: 'Active',
        document,
      };
    });
    client.donate(did, program as Program as D4LProgram, records);

    await fetch(`/api/dashboard/programs/${program.name}/enrollment`, { method: 'DELETE' });
    router.push('/dashboard');
    setLoading(false);
  }

  return (
    <>
      <Button
        suppressHydrationWarning
        onClick={() => {
          if (isButtonDisabled) return;
          setConfirmOpen(true);
        }}
        disabled={isButtonDisabled}
        className={`rounded-lg border px-6 py-3 font-medium transition-colors ${
          isButtonDisabled
            ? 'cursor-not-allowed border-gray-300 bg-gray-50 text-gray-400 opacity-50'
            : 'border-red-300 bg-white text-red-600 hover:bg-red-50'
        }`}
      >
        {loading ? t('withdrawing') : t('withdraw')}
      </Button>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={t('withdraw')}
        message={t('withdrawWarning')}
        destructive
        confirmLabel={t('withdraw')}
        onConfirm={confirmUnenroll}
      />
    </>
  );
}
