'use client';

import { useProgramDashboard } from '@/components/ProgramDashboardProvider';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export default function LoadingBar() {
  const { state } = useProgramDashboard();
  const data = state.data;

  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  useEffect(() => {
    if (data.status === 'success') {
      const fadeTimer = setTimeout(() => {
        setVisible(false);
      }, 1000);

      return () => {
        clearTimeout(fadeTimer);
      };
    }
  }, [data.status]);

  if (!mounted) return null;

  const progress = data.status === 'loading' ? data.progress : 100;

  return createPortal(
    <div
      className={`fixed inset-x-0 top-0 z-50 transition-opacity duration-1000 ease-out ${visible ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
    >
      <div className="h-1 w-full overflow-hidden bg-violet-100">
        <div
          className="h-full bg-gradient-to-r from-violet-500 to-violet-600 transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>,
    document.body,
  );
}
