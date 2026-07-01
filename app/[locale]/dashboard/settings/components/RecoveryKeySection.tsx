'use client';

import { Locale } from '@/i18n/config';
import { WebCrypto } from '@/lib/core/crypto';
import { KeyHandler, WebConverter } from '@d4l/collect-lib';
import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';

export default function RecoveryKeySection({
  recoveryKey,
  locale,
}: {
  recoveryKey: number[] | null;
  locale: Locale;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const t = useTranslations('settings');

  const mnemonic = useMemo(() => {
    if (!recoveryKey) return null;

    const crypto = new WebCrypto();
    const converter = new WebConverter();
    const keyHandler = new KeyHandler(converter, crypto);

    return keyHandler.entropyToMnemonic(Uint8Array.from(recoveryKey), locale);
  }, [recoveryKey, locale]);

  if (!recoveryKey || !mnemonic) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5">
        <p className="mb-3 text-sm font-medium text-amber-800">{t('pleaseCompleteOnboarding')}</p>
        <Link
          href="/onboarding"
          className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-amber-700 active:bg-amber-800"
        >
          {t('startOnboarding')}
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    );
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(mnemonic);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative rounded-2xl border border-gray-200 bg-gray-50/50 p-5 font-mono text-sm leading-relaxed break-words text-gray-800 select-all">
        <div className={isVisible ? '' : 'pointer-events-none blur-sm filter select-none'}>
          {mnemonic}
        </div>

        {!isVisible && (
          <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-gray-50/10 backdrop-blur-[2px]" />
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          onClick={() => setIsVisible(!isVisible)}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 active:bg-gray-100"
        >
          {isVisible ? (
            <>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"
                />
              </svg>
              {t('hideKey')}
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
              {t('showKey')}
            </>
          )}
        </Button>

        <Button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-amber-700 active:bg-amber-800"
        >
          {isCopied ? (
            <>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              {t('copied')}
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                />
              </svg>
              {t('copyKey')}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
