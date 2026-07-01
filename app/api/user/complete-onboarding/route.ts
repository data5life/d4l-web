import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { recoveryKey } = await req.json();

  await prisma.user.update({
    where: { id: session.user.id },
    data: { recoveryKey: Buffer.from(recoveryKey) },
  });
  return NextResponse.json({ success: true });
}
