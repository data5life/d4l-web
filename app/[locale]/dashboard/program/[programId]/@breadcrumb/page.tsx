import Breadcrumbs from '@/components/Breadcrumbs';
import { Locale } from '@/i18n/config';
import { resolveProgramLanguage } from '@/lib/getProgramLang';
import { getProgram } from '@/lib/getProgram';

export default async function ProgramBreadcrumb({
  params,
}: {
  params: Promise<{ programId: string; locale: Locale }>;
}) {
  const { programId, locale } = await params;
  const program = await getProgram(programId);
  const lang = resolveProgramLanguage(program.languages, locale);
  return <Breadcrumbs labelMap={{ [programId]: program.content.title[lang] }} />;
}
