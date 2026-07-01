'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { WebCrypto } from '@/lib/core/crypto';
import { Button } from '@/components/ui/button';
import { KeyHandler, WebConverter } from '@d4l/collect-lib';
import CollapsibleSection from '@/components/CollapsibleSection.client';

type Step = 'WELCOME' | 'ENTER_KEY';

export default function OnboardingForm() {
  const [step, setStep] = useState<Step>('WELCOME');
  const [passphrase, setPassphrase] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passphraseError, setPassphraseError] = useState<string | null>(null);

  const t = useTranslations('onboarding');
  const tCommon = useTranslations('common');
  const locale = useLocale();

  const router = useRouter();
  const searchParams = useSearchParams();

  const words = passphrase.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  const showWordCountWarning = wordCount > 0 && wordCount !== 12;
  const isButtonDisabled = wordCount !== 12;

  const submitRecoveryKey = async (recoveryKey: Uint8Array) => {
    try {
      const res = await fetch('/api/user/complete-onboarding', {
        method: 'POST',
        body: JSON.stringify({ recoveryKey: Array.from(recoveryKey) }),
      });

      if (res.ok) {
        const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
        router.push(callbackUrl);
        return;
      }
      setError(t('errorSetup'));
    } catch {
      setError(tCommon('networkError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateToken = async () => {
    setIsSubmitting(true);
    const crypto = new WebCrypto();

    const recoveryKey = crypto.generateKey(16);

    await submitRecoveryKey(recoveryKey);
  };

  const handleRecover = async (e: React.FormEvent) => {
    setIsSubmitting(true);

    e.preventDefault();
    if (!passphrase.trim()) return;

    const crypto = new WebCrypto();
    const converter = new WebConverter();
    const keyHandler = new KeyHandler(converter, crypto);

    const mnemonic = passphrase.trim();
    let recoveryKey;
    try {
      recoveryKey = keyHandler.mnemonicToEntropy(mnemonic, locale);
    } catch {
      setPassphraseError(t('recovery.invalidMnemonic'));
      setIsSubmitting(false);
      return;
    }

    await submitRecoveryKey(recoveryKey);
  };

  if (error)
    return (
      <div className="w-full max-w-md rounded-2xl border border-slate-100 bg-white p-6 shadow-xl transition-all duration-300 md:max-w-xl md:p-8 lg:max-w-2xl">
        <div className="space-y-6 text-center">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-800">{tCommon('error')}</h1>
            <p className="text-sm text-slate-500">{error}</p>
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <Button disabled={isSubmitting} onClick={() => setError(null)}>
              {tCommon('back')}
            </Button>
          </div>
        </div>
      </div>
    );

  return (
    <div className="w-full max-w-md rounded-2xl border border-slate-100 bg-white p-6 shadow-xl transition-all duration-300 md:max-w-xl md:p-8 lg:max-w-2xl">
      {step === 'WELCOME' && (
        <div className="space-y-6 text-center">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-800">
              {t('welcome.title')}
            </h1>
            <p className="text-sm text-slate-500">{t('welcome.description')}</p>
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <Button disabled={isSubmitting} onClick={() => setStep('ENTER_KEY')}>
              {t('welcome.actionYes')}
            </Button>
            <Button disabled={isSubmitting} onClick={generateToken}>
              {t('welcome.actionNo')}
            </Button>
          </div>
        </div>
      )}

      {step === 'ENTER_KEY' && (
        <form onSubmit={handleRecover} className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-xl font-bold text-slate-800">{t('recovery.title')}</h1>
            <p className="text-sm text-slate-500">{t('recovery.description')}</p>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold tracking-wider text-slate-600 uppercase">
              {t('recovery.label')}
            </label>
            <div className="pt-1 pl-3">
              <textarea
                required
                value={passphrase}
                onChange={(e) => {
                  setPassphrase(e.target.value);
                  if (passphraseError) setPassphraseError(null);
                }}
                placeholder={t('recovery.placeholder')}
                className={`min-h-[60px] w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 transition-all placeholder:text-slate-400 focus-visible:border-violet-500 focus-visible:ring-2 focus-visible:ring-violet-500/20 focus-visible:outline-none lg:h-[40px] lg:min-h-[40px] ${
                  showWordCountWarning || passphraseError
                    ? 'border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/20'
                    : ''
                }`}
              />
              {(showWordCountWarning || passphraseError) && (
                <p className="mt-1 text-xs font-medium text-red-500">
                  {passphraseError || t('recovery.errorWordCount', { count: wordCount })}
                </p>
              )}
            </div>
          </div>

          <div className="rounded-r-md border-l-4 border-blue-500 bg-blue-50 p-4 shadow-sm">
            <div className="flex items-start gap-2">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-blue-500"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <p className="mb-1 text-sm font-medium text-blue-800">
                  {t('recovery.noticeSummary')}
                </p>

                <CollapsibleSection
                  label={tCommon('showDetails')}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <p className="text-xs leading-relaxed text-blue-700">
                    {t('recovery.noticeDetails')}
                  </p>
                </CollapsibleSection>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <Button type="submit" disabled={isButtonDisabled || isSubmitting}>
              {t('recovery.submit')}
            </Button>
            <Button disabled={isSubmitting} onClick={() => setStep('WELCOME')}>
              {tCommon('back')}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
