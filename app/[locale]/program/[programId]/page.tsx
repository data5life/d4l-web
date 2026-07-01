import { auth } from '@/auth';
import { getEnrollment } from '@/lib/getEnrollment';
import { getProgram } from '@/lib/getProgram';
import { Locale } from '@/i18n/config';
import { resolveProgramLanguage } from '@/lib/getProgramLang';
import { User } from '@prisma/client';
import ProgramHeader from '@/components/program/ProgramHeader.server';
import EnrollButton from '@/components/program/EnrollButton.client';
import { ProgramDashboardButton } from './components/ProgramDashboardButton';

interface PageProps {
  params: Promise<{ programId: string; locale: Locale }>;
}

export default async function Page({ params }: PageProps) {
  const { programId, locale } = await params;
  const program = await getProgram(programId);
  const lang = resolveProgramLanguage(program.languages, locale);

  const session = await auth();
  const user = session?.user as User | undefined;

  let isEnrolled = false;
  let recoveryKey: Uint8Array | null = null;

  if (user) {
    const enrollment = await getEnrollment(user.id, programId);
    isEnrolled = !!enrollment;

    if (user.recoveryKey) {
      recoveryKey = new Uint8Array(Object.values(user.recoveryKey));
    }
  }

  return (
    <main className="animate-slideUp relative container mx-auto px-4 py-8">
      <div className="relative container mx-auto px-4 py-16">
        {isEnrolled ? (
          <>
            <ProgramHeader
              program={program}
              lang={lang}
              locale={locale}
              action={
                <ProgramDashboardButton programId={programId} text={'Open Study Dashboard'} />
              }
            />
          </>
        ) : (
          <>
            <ProgramHeader
              program={program}
              lang={lang}
              locale={locale}
              action={<EnrollButton program={program} recoveryKey={recoveryKey} isGuest={!user} />}
            />
          </>
        )}
      </div>
    </main>
  );
}
