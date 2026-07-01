import { auth } from '@/auth';
import { ProgramDashboardProvider } from '@/components/ProgramDashboardProvider';
import LoadingBar from './components/LoadingBar.client';
import { getProgram } from '@/lib/getProgram';
import { resolveProgramLanguage } from '@/lib/getProgramLang';
import { getEnrollment } from '@/lib/getEnrollment';
import { User } from '@prisma/client';
import { redirect } from 'next/navigation';
import { DonorIdentity } from '@d4l/collect-lib';

export default async function ProgramDashboardLayout({
  children,
  breadcrumb,
  params,
}: {
  children: React.ReactNode;
  breadcrumb: React.ReactNode;
  params: Promise<{ locale: string; programId: string }>;
}) {
  const session = await auth();

  const { locale, programId } = await params;

  const user = session!.user! as User;
  const program = await getProgram(programId);
  const lang = resolveProgramLanguage(program.languages, locale);

  const enrollment = await getEnrollment(user.id, programId);

  const isEnrolled = enrollment !== null;
  if (!isEnrolled) redirect(`/${locale}/program/${programId}`);

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-violet-50/30 to-purple-50/50">
      <ProgramDashboardProvider program={program} lang={lang} did={enrollment.did as DonorIdentity}>
        <div className="px-4">{breadcrumb}</div>
        <LoadingBar />
        {children}
      </ProgramDashboardProvider>
    </div>
  );
}
