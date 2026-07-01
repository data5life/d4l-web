'use client';

import { ReactNode } from 'react';
import { useRouter } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
}
export default function ProgramSearchButton({ children }: Props) {
  const router = useRouter();
  return (
    <Button
      onClick={() => router.push('/search')}
      className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-violet-700 px-6 py-3 font-semibold text-white shadow-lg shadow-violet-500/30 transition-all duration-300 hover:from-violet-700 hover:to-violet-800"
    >
      {children}
    </Button>
  );
}
