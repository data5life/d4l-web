'use client';

import { ReactNode } from 'react';
import { useRouter } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  programId: string;
}
export default function ProgramButton({ children, programId }: Props) {
  const router = useRouter();
  return (
    <Button
      onClick={() => router.push(`/dashboard/program/${programId}`)}
      className="group block h-auto w-full rounded-2xl border border-white/50 bg-white/90 p-6 text-left whitespace-normal shadow-lg backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]"
    >
      {children}
    </Button>
  );
}
