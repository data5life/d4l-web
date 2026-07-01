import Breadcrumbs from '@/components/Breadcrumbs';
import { Locale } from '@/i18n/config';
import { resolveProgramLanguage } from '@/lib/getProgramLang';
import { getProgram } from '@/lib/getProgram';
import { getQuestionnaire } from '@/lib/getQuestionnaire';

export default async function QuestionnaireBreadcrumb({
  params,
}: {
  params: Promise<{ programId: string; questionnaireId: string; locale: Locale }>;
}) {
  const { programId, questionnaireId, locale } = await params;
  const program = await getProgram(programId);
  const lang = resolveProgramLanguage(program.languages, locale);
  const questionnaire = await getQuestionnaire(programId, lang, questionnaireId);

  return (
    <Breadcrumbs
      labelMap={{
        [programId]: program.content.title[lang],
        [questionnaireId]: questionnaire.title,
      }}
    />
  );
}
