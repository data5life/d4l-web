'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function QuestionnaireError() {
  const t = useTranslations('common');
  const q = useTranslations('questionnaire');
  const router = useRouter();
  const { programId } = useParams<{ programId: string }>();
  return (
    <div className="animate-fadeIn mx-auto max-w-md py-12 text-center">
      <h2 className="mb-4 text-3xl font-bold text-gray-800">{q('questionnaireErrorTitle')}</h2>
      <Button
        onClick={() => router.push(`/dashboard/program/${programId}`)}
        className="mt-4 bg-violet-600 text-white hover:bg-violet-700"
      >
        {t('goBack')}
      </Button>
    </div>
  );
}
