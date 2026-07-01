import type { Metadata } from 'next';
import { auth } from '@/auth';
import { getEnrollment } from '@/lib/getEnrollment';
import { getProgram } from '@/lib/getProgram';
import { Locale } from '@/i18n/config';
import { resolveProgramLanguage } from '@/lib/getProgramLang';
import { getTranslations } from 'next-intl/server';
import { User } from '@prisma/client';
import ProgramHeader from '@/components/program/ProgramHeader.server';
import TaskList from './components/TaskList.client';
import ConsentList from './components/ConsentList.client';
import SubmissionsList from './components/SubmissionList.client';
import UnenrollButton from '@/components/program/UnenrollButton.client';
import ProgramEndedNotice from './components/ProgramEndedNotice.server';

interface PageProps {
  params: Promise<{ programId: string; locale: Locale }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { programId, locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta.pageTitle' });
  try {
    const program = await getProgram(programId);
    const lang = resolveProgramLanguage(program.languages, locale);
    return { title: program.content.title[lang] ?? t('program') };
  } catch {
    return { title: t('program') };
  }
}

export default async function Page({ params }: PageProps) {
  const { programId, locale } = await params;
  const session = await auth();

  const user = session!.user! as User;
  const program = await getProgram(programId);
  const lang = resolveProgramLanguage(program.languages, locale);
  const hasEnded = program.endDate ? new Date(program.endDate) < new Date() : false;

  const enrollment = await getEnrollment(user.id, programId)!;

  if (!enrollment) return null;

  return (
    <main className="animate-slideUp relative container mx-auto px-4">
      <div className="relative container mx-auto px-4 py-8">
        <ProgramHeader
          collapsible
          program={program}
          lang={lang}
          locale={locale}
          action={<UnenrollButton />}
        />
        {hasEnded ? <ProgramEndedNotice locale={locale} /> : <TaskList />}
        <ConsentList />
        <SubmissionsList />
      </div>
    </main>
  );
}
