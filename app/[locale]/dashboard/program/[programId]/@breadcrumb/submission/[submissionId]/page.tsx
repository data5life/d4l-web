'use client';
import Breadcrumbs from '@/components/Breadcrumbs';
import { useProgramDashboard } from '@/components/ProgramDashboardProvider';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';

export default function SubmissionBreadcrumb() {
  const { submissionId } = useParams<{ submissionId: string }>();
  const { state } = useProgramDashboard();
  const { program, lang, data } = state;
  const t = useTranslations('common');
  if (data.status === 'loading')
    return (
      <Breadcrumbs
        labelMap={{ [program.name]: program.content.title[lang], [submissionId]: t('loading') }}
      />
    );

  function errorBreadcrumb() {
    return (
      <Breadcrumbs
        labelMap={{ [program.name]: program.content.title[lang], [submissionId]: t('error') }}
      />
    );
  }
  if (data.status === 'error') return errorBreadcrumb();

  const submission = data.resources.find((s) => s.id === submissionId);
  if (submission?.type !== 'Questionnaire') return errorBreadcrumb();
  const questionnaire = data.programQuestionnaires.get(submission.questionnaire.name);
  if (!questionnaire) return errorBreadcrumb();

  return (
    <Breadcrumbs
      labelMap={{
        [program.name]: program.content.title[lang],
        [submissionId]: questionnaire?.title,
      }}
    />
  );
}
