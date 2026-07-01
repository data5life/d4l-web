import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { User } from '@prisma/client';
import { NextResponse } from 'next/server';
import { Temporal } from 'temporal-polyfill';

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { timeZone, locale } = await req.json();
  const user = session.user as User;
  const oldTimeZone = user.timeZone;

  await prisma.user.update({
    where: { id: session.user.id },
    data: { timeZone, preferredLanguage: locale },
  });

  if (oldTimeZone !== timeZone) {
    const jobs = await prisma.notificationJob.findMany({
      where: { userId: user.id },
      select: { id: true, runAt: true },
    });

    await prisma.$transaction(
      jobs.map((job) => {
        const instant = Temporal.Instant.fromEpochMilliseconds(job.runAt.getTime());
        const oldZonedDateTime = instant.toZonedDateTimeISO(oldTimeZone);
        const wallClockTime = oldZonedDateTime.toPlainDateTime();
        const newZonedDateTime = wallClockTime.toZonedDateTime(timeZone);
        const newUtcDate = new Date(newZonedDateTime.epochMilliseconds);

        return prisma.notificationJob.update({
          where: { id: job.id },
          data: { runAt: newUtcDate },
        });
      }),
    );
  }

  return NextResponse.json({ success: true });
}
