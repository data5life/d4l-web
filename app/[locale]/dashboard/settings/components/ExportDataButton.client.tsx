'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import { createDonationClient } from '@/lib/donation/create-client';
import { getResources } from '@/lib/getResources';
import type { DonorIdentity } from '@d4l/collect-lib';

interface BaseExportData {
  exportedAt: string;
  user: {
    id: string;
  };
  linkedAccounts: unknown;
  enrollments: {
    programId: string;
    did: DonorIdentity;
    subjectId: string;
    enrolledAt: string;
  }[];
}

type DispatcherExportItem =
  | {
      programId: string;
      subjectId: string;
      enrolledAt: string;
      status: 'success';
      data: unknown;
    }
  | {
      programId: string;
      subjectId: string;
      enrolledAt: string;
      status: 'error';
      error: string;
    };

export default function ExportDataButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const t = useTranslations('settings');
  const common = useTranslations('common');

  const handleExport = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/user/export');

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || t('exportFailed'));
      }

      const baseExport = (await response.json()) as BaseExportData;
      const donationClient = createDonationClient();

      const settledResults = await Promise.allSettled(
        baseExport.enrollments.map(async (enrollment) => {
          const data = await getResources(donationClient, enrollment.did, enrollment.programId);

          return {
            programId: enrollment.programId,
            subjectId: enrollment.subjectId,
            enrolledAt: enrollment.enrolledAt,
            status: 'success' as const,
            data,
          };
        }),
      );

      const d4lDispatcherData: DispatcherExportItem[] = settledResults.map((result, index) => {
        const enrollment = baseExport.enrollments[index];

        if (result.status === 'fulfilled') {
          return result.value;
        }

        return {
          programId: enrollment.programId,
          subjectId: enrollment.subjectId,
          enrolledAt: enrollment.enrolledAt,
          status: 'error' as const,
          error:
            result.reason instanceof Error
              ? result.reason.message
              : String(result.reason ?? t('exportFailed')),
        };
      });

      const finalExport = {
        exportedAt: baseExport.exportedAt,
        user: baseExport.user,
        linkedAccounts: baseExport.linkedAccounts,
        d4lDispatcherData,
      };

      const filename = `data-export-${baseExport.user.id}-${Date.now()}.json`;
      const blob = new Blob([JSON.stringify(finalExport, null, 2)], {
        type: 'application/json;charset=utf-8',
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : common('genericError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <Button
        onClick={handleExport}
        disabled={isLoading}
        className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-3 font-medium text-white transition-colors hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading ? (
          <>
            <Spinner />
            <span>{t('exporting')}</span>
          </>
        ) : (
          <>
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            <span>{t('downloadData')}</span>
          </>
        )}
      </Button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
