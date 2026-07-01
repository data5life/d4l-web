'use client';

import { Button } from '@/components/ui/button';
import { useRouter } from '@/i18n/navigation';

export function ProgramDashboardButton({ programId, text }: { programId: string; text: string }) {
  const router = useRouter();
  return (
    <Button
      onClick={() => router.push(`/dashboard/program/${programId}`)}
      className="rounded-lg bg-violet-600 px-6 py-3 font-medium text-white transition-colors hover:bg-violet-700 disabled:opacity-50"
    >
      {text}
    </Button>
  );
}
