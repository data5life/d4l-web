import type { Metadata } from 'next';
import { QuestionnaireShell } from '@/components/questionnaire/QuestionnaireShell';
import { getTranslations } from 'next-intl/server';
import { getQuestionnaire } from '@/lib/getQuestionnaire';
import { Locale } from '@/i18n/config';

type PageProps = {
  params: Promise<{ programId: string; questionnaireId: string; locale: Locale }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { programId, questionnaireId, locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta.pageTitle' });
  try {
    const questionnaire = await getQuestionnaire(programId, locale, questionnaireId);
    return { title: questionnaire.title || t('questionnaire') };
  } catch {
    return { title: t('questionnaire') };
  }
}

export default async function QuestionnairePage({ params }: PageProps) {
  const { questionnaireId } = await params;

  return (
    <main className="relative container mx-auto px-4">
      <QuestionnaireShell questionnaireName={questionnaireId} mode="new" />
    </main>
  );
}
