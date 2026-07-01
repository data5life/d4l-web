/*
 * Search Bar to type in the program name. Redirects to the program page when hitting find.
 * Shows error if the program is not found or if the input is empty.
 */

'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { validateProgramId } from '@/lib/validateProgramId';

export default function ProgramSearch() {
  const t = useTranslations('search');
  const router = useRouter();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFind() {
    const trimmed = input.trim();

    if (!trimmed) {
      setError(t('searchErrorEmpty'));
      return;
    }

    setLoading(true);
    setError(null);

    const result = await validateProgramId(trimmed);

    if (result.status === 'not_found') {
      setError(t('searchErrorNotFound'));
      setLoading(false);
      return;
    }

    if (result.status === 'error') {
      setError(t('searchErrorServer'));
      setLoading(false);
      return;
    }

    router.push(`/program/${trimmed}`);
  }

  return (
    <div className="flex w-full flex-col items-center gap-2">
      <div className="flex w-full items-center space-x-2">
        <Input
          placeholder={t('searchPlaceholder')}
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setError(null);
          }}
          onKeyDown={(e) => e.key === 'Enter' && handleFind()}
          disabled={loading}
        />
        <Button
          onClick={handleFind}
          disabled={loading}
          className="bg-violet-600 text-white hover:bg-violet-700"
        >
          {loading ? t('searching') : t('find')}
        </Button>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
