'use client';

import { useState } from 'react';
import { signOut } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export default function DeleteAccountButton() {
  const [showModal, setShowModal] = useState(false);
  const [confirmation, setConfirmation] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const t = useTranslations('settings');
  const common = useTranslations('common');

  const phrase = t('deletePhrase');

  const handleDelete = async () => {
    if (confirmation !== phrase) {
      setError(t('deleteConfirmError', { phrase }));
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch('/api/user', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmation }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || t('deleteFailed'));
      }

      // Sign out and redirect to login
      await signOut({ callbackUrl: '/login' });
    } catch (err) {
      setError(err instanceof Error ? err.message : common('genericError'));
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    setShowModal(false);
    setConfirmation('');
    setError(null);
  };

  return (
    <>
      <Button
        onClick={() => setShowModal(true)}
        className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-6 py-3 font-medium text-white transition-colors hover:bg-red-700"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          />
        </svg>
        <span>{t('deleteButton')}</span>
      </Button>

      <Dialog open={showModal} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <svg
                  className="h-6 w-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <DialogTitle className="text-xl font-bold text-gray-900">
                {t('deleteModalTitle')}
              </DialogTitle>
            </div>
          </DialogHeader>

          <DialogDescription className="text-gray-600">{t('deleteModalIntro')}</DialogDescription>

          <ul className="list-inside list-disc space-y-1 text-sm text-gray-600">
            <li>{t('deleteListProfile')}</li>
            <li>{t('deleteListResponses')}</li>
            <li>{t('deleteListConsents')}</li>
            <li>{t('deleteListAccounts')}</li>
          </ul>

          <p className="text-gray-600">{t('deleteConfirmPrompt', { phrase })}</p>

          <input
            type="text"
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            placeholder={t('deletePlaceholder', { phrase })}
            className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-red-500 focus:ring-2 focus:ring-red-500"
            disabled={isDeleting}
          />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <DialogFooter>
            <Button
              onClick={handleClose}
              disabled={isDeleting}
              className="h-auto flex-1 rounded-xl bg-gray-100 px-4 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-200 disabled:opacity-50"
            >
              {common('cancel')}
            </Button>
            <Button
              onClick={handleDelete}
              disabled={isDeleting || confirmation !== phrase}
              className="h-auto flex-1 rounded-xl bg-red-600 px-4 py-3 font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isDeleting ? t('deleting') : t('deleteConfirmButton')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
