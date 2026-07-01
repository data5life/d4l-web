'use client';

import { useState } from 'react';
import { ConsentPopup } from './ConsentPopup.client';
import { DashboardConsent } from '@/components/ProgramDashboardProvider';
import { Button } from '@/components/ui/button';

interface Props {
  consent: DashboardConsent;
  programId: string;
  children: React.ReactNode;
}

export default function ConsentButton({ consent, programId, children }: Props) {
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const handleClick = () => {
    setIsPopupOpen(true);
  };

  const closePopup = () => setIsPopupOpen(false);

  return (
    <>
      <Button
        onClick={handleClick}
        className="group block h-auto w-full rounded-xl border border-gray-200 bg-white p-4 text-left whitespace-normal transition-all duration-200 hover:border-violet-300 hover:bg-gray-50 hover:shadow-md"
      >
        {children}
      </Button>

      <ConsentPopup
        isOpen={isPopupOpen}
        closePopup={closePopup}
        programId={programId}
        consent={consent}
        isUserConsent={true}
      />
    </>
  );
}
