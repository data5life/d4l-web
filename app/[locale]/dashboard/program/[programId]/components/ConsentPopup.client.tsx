// TODO: If a new major version is available:
// In the consent popup, indicate that the user has already accepted
// a previous version, but must accept the latest version.
// Optionally include the previous consent text as a reference,
// e.g., in a collapsible section.
'use client';

import { useState } from 'react';
import { RichTextRenderer } from '@/components/RichTextRenderer';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Program as D4LProgram, ULIDtoUUID, DonationRecord } from '@d4l/collect-lib';
import { resourcesToFHIR } from '@/lib/fhir-parser/resource';
import {
  updateOrCreateResearchSubject,
  updateOrCreateResourceConsent,
} from '@/lib/donation/upsert-resources';
import { Spinner } from '@/components/ui/spinner';
import { createDonationClient } from '@/lib/donation/create-client';
import {
  DashboardConsent,
  useDashboardData,
  useProgramDashboard,
} from '@/components/ProgramDashboardProvider';
import { Program } from '@/lib/programTypes';
import { Task } from '@/lib/evaluateTasks';

interface ConsentPopupProps {
  isOpen: boolean;
  closePopup: () => void;
  consent: DashboardConsent;
  programId: string;
  isUserConsent?: boolean;
  onAccept?: () => void;
}

export const ConsentPopup = ({
  isOpen,
  closePopup,
  consent,
  programId,
  isUserConsent,
  onAccept,
}: ConsentPopupProps) => {
  const t = useTranslations('program');
  const router = useRouter();
  const { state, updateConsent, allTasks } = useProgramDashboard();
  const lang = state.lang;
  const tCommon = useTranslations('common');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmRevokeOpen, setConfirmRevokeOpen] = useState(false);
  const [declineAlertOpen, setDeclineAlertOpen] = useState(false);

  const accepted = consent.accepted;
  const program = state.program;
  const data = useDashboardData();

  const required = allTasks?.find(
    (task: Task) => task.type === 'consent' && task.consentKey === consent.name,
  )?.required;

  const handleConsent = async (accepted: boolean): Promise<boolean> => {
    const leaveStudy = !accepted && required;
    if (leaveStudy) {
      if (isUserConsent) {
        setConfirmRevokeOpen(true);
      } else {
        setDeclineAlertOpen(true);
      }
      return false;
    }
    await performConsentChange(accepted);
    return true;
  };

  const performConsentChange = async (accepted: boolean) => {
    const leaveStudy = !accepted && required;
    setIsSubmitting(true);

    const client = createDonationClient();

    const did = state.did;
    const parsedResources = data.resources;

    const now = new Date().toISOString();

    const researchSubject = updateOrCreateResearchSubject(
      parsedResources,
      programId,
      'anonymous',
      leaveStudy ? 'off-study' : 'on-study',
      now,
    );

    const consentDonation = updateOrCreateResourceConsent(
      parsedResources,
      consent,
      programId,
      accepted,
      now,
    );

    const resources = [researchSubject, consentDonation];
    const resourcesFHIR = resourcesToFHIR(resources);

    const records: DonationRecord[] = resourcesFHIR.map((document) => {
      return {
        id: ULIDtoUUID(document.id!),
        status: 'Active',
        document,
      };
    });

    const d4lProgram = program as Program as D4LProgram;

    const donationResult = leaveStudy
      ? await client.revoke(did, d4lProgram, records)
      : await client.donate(did, d4lProgram, records);

    if (!donationResult) {
      throw new Error('Error when donating consents');
    }

    if (leaveStudy) {
      await fetch(`/api/dashboard/programs/${program.name}/enrollment`, { method: 'DELETE' });
      router.push(`/program/${programId}`);
      return;
    }
    updateConsent(resources);
    setIsSubmitting(false);
  };

  if (error || required === undefined) {
    return (
      <Dialog open={isOpen} onOpenChange={closePopup}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('errorTitle')}</DialogTitle>
          </DialogHeader>
          <div>{error}</div>
          <DialogFooter>
            <Button onClick={closePopup}>OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  if (!consent) return null;
  const showDeclineButton = !isUserConsent;
  const showRevokeButton = accepted;
  const showAcceptButton = !isUserConsent || !accepted;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={closePopup}>
        <DialogContent
          className="max-w-xl overflow-hidden"
          showCloseButton={!isSubmitting}
          onPointerDownOutside={(e) => isSubmitting && e.preventDefault()}
          onEscapeKeyDown={(e) => isSubmitting && e.preventDefault()}
        >
          {isSubmitting && (
            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/70 backdrop-blur-[1px] transition-all dark:bg-gray-950/70">
              <Spinner />
              <span className="mt-2 text-sm font-medium text-gray-600 dark:text-gray-300">
                {tCommon('loading')}
              </span>
            </div>
          )}

          <DialogHeader>
            <DialogTitle>{consent.title[lang]}</DialogTitle>
          </DialogHeader>

          <div className="flex items-center gap-2">
            {required && (
              <span className="inline-flex items-center rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700">
                {tCommon('required')}
              </span>
            )}
            {required && accepted !== null && (
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                  accepted ? 'bg-violet-100 text-violet-700' : 'bg-gray-100 text-gray-400'
                }`}
              >
                {accepted ? t('accepted') : t('declined')}
              </span>
            )}
          </div>

          <RichTextRenderer content={consent.text[lang]!} />

          <DialogFooter className="flex justify-end gap-2">
            {showDeclineButton && (
              <Button
                variant="secondary"
                disabled={isSubmitting}
                onClick={async () => {
                  try {
                    const completed = await handleConsent(false);
                    if (completed) closePopup();
                  } catch (err) {
                    const message = err instanceof Error ? err.message : String(err);
                    setError(message);
                  }
                }}
              >
                {t('decline')}
              </Button>
            )}
            {showRevokeButton && (
              <Button
                variant="secondary"
                disabled={isSubmitting}
                onClick={async () => {
                  try {
                    const completed = await handleConsent(false);
                    if (completed) closePopup();
                  } catch (err) {
                    const message = err instanceof Error ? err.message : String(err);
                    setError(message);
                  }
                }}
              >
                {t('revoke')}
              </Button>
            )}
            {showAcceptButton && (
              <Button
                disabled={isSubmitting}
                onClick={async () => {
                  try {
                    const completed = await handleConsent(true);
                    if (completed) {
                      if (onAccept) {
                        onAccept();
                      } else {
                        closePopup();
                      }
                    }
                  } catch (err) {
                    const message = err instanceof Error ? err.message : String(err);
                    setError(message);
                  }
                }}
              >
                {t('accept')}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={confirmRevokeOpen}
        onOpenChange={setConfirmRevokeOpen}
        title={t('revoke')}
        message={t('consentRevokeWarning')}
        destructive
        confirmLabel={t('revoke')}
        onConfirm={async () => {
          try {
            await performConsentChange(false);
          } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            setError(message);
          }
        }}
      />
      <ConfirmDialog
        mode="alert"
        open={declineAlertOpen}
        onOpenChange={(open) => {
          setDeclineAlertOpen(open);
          if (!open) closePopup();
        }}
        title={t('decline')}
        message={t('consentDeclineWarning')}
      />
    </>
  );
};
