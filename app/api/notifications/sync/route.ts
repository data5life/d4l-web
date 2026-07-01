import { auth } from '@/auth';
import { calculateIteration } from '@/lib/iterationCalculator';
import { prisma } from '@/lib/prisma';
import { TaskFrequency } from '@d4l/collect-lib';
import { User } from '@prisma/client';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;
  const user = session.user as User;
  const { notifications, programName, clientTimestamp } = (await req.json()) as {
    programName: string;
    clientTimestamp: string;
    notifications: {
      questionnaireName: string;
      frequency: TaskFrequency;
      availableFrom: string | null;
    }[];
  };

  const clientDate = new Date(clientTimestamp);
  if (clientDate > new Date()) {
    return NextResponse.json({ error: 'clientTimestamp is in the future' });
  }

  await prisma.$transaction(async (tx) => {
    const updateResult = await tx.enrollment.updateMany({
      where: {
        userId,
        programId: programName,
        OR: [{ lastNotificationSync: null }, { lastNotificationSync: { lt: clientDate } }],
      },
      data: {
        lastNotificationSync: clientDate,
      },
    });

    if (updateResult.count === 0) {
      throw new Error('RaceConditionDetected');
    }

    await tx.notificationJob.deleteMany({
      where: {
        userId,
        programId: programName,
      },
    });

    const jobsToCreate = notifications
      .map((n) => {
        let runAt;
        if (n.availableFrom) runAt = new Date(n.availableFrom);
        else {
          const it = calculateIteration(n.frequency, user.timeZone);
          if (it.status === 'not_started') {
            runAt = it.start;
          } else if (it.status === 'active' && !it.info.isLastIteration) {
            runAt = it.info.iterationEnd;
          } else return null;
        }

        return {
          userId,
          programId: programName,
          questionnaireName: n.questionnaireName,
          frequency: n.frequency,
          runAt: runAt!,
        };
      })
      .filter((j) => j !== null);

    if (jobsToCreate.length > 0)
      await tx.notificationJob.createMany({
        data: jobsToCreate,
      });
  });
  return NextResponse.json({ success: true });
}
