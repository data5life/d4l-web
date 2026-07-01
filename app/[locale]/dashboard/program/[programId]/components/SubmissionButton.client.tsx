'use client';
import { useRouter } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';

interface Props {
  submissionId: string;
  programId: string;
  children: React.ReactNode;
}

export default function SubmissionButton({ submissionId, programId, children }: Props) {
  const router = useRouter();
  return (
    <Button
      onClick={() => router.push(`/dashboard/program/${programId}/submission/${submissionId}`)}
      className="group block h-auto w-full rounded-xl border border-gray-200 bg-gray-50 p-4 text-left whitespace-normal transition-all duration-200 hover:border-violet-300 hover:bg-violet-50"
    >
      {children}
    </Button>
  );
}
