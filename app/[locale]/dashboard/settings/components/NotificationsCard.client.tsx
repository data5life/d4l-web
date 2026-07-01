'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Toggle } from '@/components/ui/toggle';

export interface ProgramRow {
  programId: string;
  title: string;
}

interface Props {
  initialGlobalEnabled: boolean;
  initialPerProgram: Record<string, boolean>;
  programs: ProgramRow[];
}

export default function NotificationsCard({
  initialGlobalEnabled,
  initialPerProgram,
  programs,
}: Props) {
  const t = useTranslations('settings');
  const common = useTranslations('common');

  const [globalEnabled, setGlobalEnabled] = useState(initialGlobalEnabled);
  const [perProgram, setPerProgram] = useState<Record<string, boolean>>(initialPerProgram);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});
  const programEnabled = (programId: string) => perProgram[programId] ?? true;
  const perProgramDisabled = !globalEnabled;

  async function patchJSON(url: string, body: unknown): Promise<void> {
    let res: Response;
    try {
      res = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    } catch {
      throw new Error(common('networkError'));
    }
    if (!res.ok) throw new Error(await res.text());
  }

  async function setGlobal(next: boolean) {
    const prev = globalEnabled;
    setGlobalEnabled(next);
    setGlobalError(null);
    try {
      await patchJSON('/api/user/notifications', { enabled: next });
    } catch (err) {
      setGlobalEnabled(prev);
      setGlobalError(err instanceof Error ? err.message : common('genericError'));
    }
  }

  async function setProgram(programId: string, next: boolean) {
    const prev = programEnabled(programId);
    setPerProgram((p) => ({ ...p, [programId]: next }));
    setRowErrors((e) => ({ ...e, [programId]: '' }));
    try {
      await patchJSON(`/api/user/notifications/${encodeURIComponent(programId)}`, {
        enabled: next,
      });
    } catch (err) {
      setPerProgram((p) => ({ ...p, [programId]: prev }));
      setRowErrors((e) => ({
        ...e,
        [programId]: err instanceof Error ? err.message : common('genericError'),
      }));
    }
  }

  return (
    <div className="mb-6 rounded-3xl border border-white/50 bg-white/90 p-8 shadow-xl backdrop-blur-xl">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100">
          <svg
            className="h-6 w-6 text-amber-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900">{t('notificationsTitle')}</h2>
      </div>

      <p className="mb-6 text-gray-600">{t('notificationsDescription')}</p>

      <div className="mb-2 flex items-center justify-between gap-4 rounded-2xl bg-gray-50 p-4">
        <span className="font-medium text-gray-900">{t('notificationsGlobalLabel')}</span>
        <Toggle
          checked={globalEnabled}
          onChange={setGlobal}
          aria-label={t('notificationsGlobalLabel')}
        />
      </div>
      {globalError && <p className="mb-4 text-sm text-red-600">{globalError}</p>}

      {programs.length > 0 && (
        <div className="mt-6">
          <h3 className="mb-3 text-sm font-semibold tracking-wide text-gray-500 uppercase">
            {t('notificationsPerStudyHeading')}
          </h3>
          {perProgramDisabled && (
            <p className="mb-3 text-sm text-gray-500">{t('notificationsGlobalOffHint')}</p>
          )}
          <ul className={`space-y-2 ${perProgramDisabled ? 'opacity-50' : ''}`}>
            {programs.map((p) => {
              const enabled = programEnabled(p.programId);
              return (
                <li key={p.programId} className="rounded-xl border border-gray-100 bg-white p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-gray-900">{p.title}</p>
                      <p className="text-xs text-gray-500">
                        {enabled && !perProgramDisabled
                          ? t('notificationsRowOn')
                          : t('notificationsRowOff')}
                      </p>
                    </div>
                    <Toggle
                      checked={enabled}
                      disabled={perProgramDisabled}
                      onChange={(next) => setProgram(p.programId, next)}
                      aria-label={p.title}
                    />
                  </div>
                  {rowErrors[p.programId] && (
                    <p className="mt-2 text-xs text-red-600">{rowErrors[p.programId]}</p>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
