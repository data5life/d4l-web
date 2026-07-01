'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { Toggle } from '@/components/ui/toggle';
import { Button } from '@/components/ui/button';

interface Props {
  token: string;
  programTitle: string;
  initialEnabled: boolean;
  initialGlobalDisabled: boolean;
}

export default function UnsubscribeActions({
  token,
  programTitle,
  initialEnabled,
  initialGlobalDisabled,
}: Props) {
  const t = useTranslations('unsubscribe');
  const common = useTranslations('common');

  const [enabled, setEnabled] = useState(initialEnabled);
  const [globalDisabled, setGlobalDisabled] = useState(initialGlobalDisabled);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function callApi(scope: 'program' | 'global', next: boolean) {
    let res: Response;
    try {
      res = await fetch('/api/notifications/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, scope, enabled: next }),
      });
    } catch {
      throw new Error(common('networkError'));
    }
    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      throw new Error(data?.error || t('errorGeneric'));
    }
  }

  function toggleProgram() {
    if (isPending || globalDisabled) return;
    const next = !enabled;
    const prev = enabled;
    setEnabled(next);
    setError(null);
    startTransition(async () => {
      try {
        await callApi('program', next);
      } catch (err) {
        setEnabled(prev);
        setError(err instanceof Error ? err.message : t('errorGeneric'));
      }
    });
  }

  function handleUnsubscribeAll() {
    if (isPending) return;
    setError(null);
    startTransition(async () => {
      try {
        await callApi('global', false);
        setGlobalDisabled(true);
        setEnabled(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : t('errorGeneric'));
      }
    });
  }

  const headlineKey = globalDisabled
    ? 'stateAllOff'
    : enabled
      ? 'stateOnProgram'
      : 'stateOffProgram';

  return (
    <div>
      <p
        className={`mb-6 text-center text-lg ${
          enabled && !globalDisabled ? 'text-emerald-700' : 'text-gray-700'
        }`}
      >
        {t.rich(headlineKey, {
          programTitle,
          bold: (chunks) => <strong>{chunks}</strong>,
        })}
      </p>

      <div
        className={`flex items-center justify-between gap-4 rounded-2xl border p-5 transition-colors ${
          enabled && !globalDisabled
            ? 'border-emerald-200 bg-emerald-50'
            : 'border-gray-200 bg-gray-50'
        } ${globalDisabled ? 'opacity-60' : ''}`}
      >
        <div className="flex-1">
          <p className="text-base font-semibold text-gray-900">
            {t('toggleLabel', { programTitle })}
          </p>
          <p className="mt-0.5 text-sm text-gray-500">
            {enabled && !globalDisabled ? t('toggleHintOn') : t('toggleHintOff')}
          </p>
        </div>
        <Toggle
          checked={enabled && !globalDisabled}
          disabled={isPending || globalDisabled}
          onChange={() => toggleProgram()}
          aria-label={t('toggleLabel', { programTitle })}
        />
      </div>

      {error && <p className="mt-4 rounded-xl bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}

      <div className="mt-8 border-t border-gray-100 pt-6">
        {globalDisabled ? (
          <p className="text-center text-sm text-gray-500">{t('unsubscribedAll')}</p>
        ) : (
          <Button
            type="button"
            onClick={handleUnsubscribeAll}
            disabled={isPending}
            className="block w-full bg-transparent text-center text-sm text-gray-500 underline transition-colors hover:text-gray-800 disabled:opacity-50"
          >
            {t('unsubscribeAll')}
          </Button>
        )}
      </div>
    </div>
  );
}
