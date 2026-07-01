import type { Metadata } from 'next';
import { QuestionnaireShell } from '@/components/questionnaire/QuestionnaireShell';
import { getTranslations } from 'next-intl/server';

type PageProps = {
  params: Promise<{ submissionId: string; locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta.pageTitle' });
  return { title: t('submission') };
}

export default async function SubmissionEditPage({ params }: PageProps) {
  const { submissionId } = await params;

  return (
    <main className="relative container mx-auto px-4">
      <div className="mx-auto max-w-4xl">
        <QuestionnaireShell submissionId={submissionId} mode="submission" />
      </div>
    </main>
  );
}
