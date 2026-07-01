import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

/** Toggle the global notification preference for the signed-in user. */
export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const enabled = (body as { enabled?: unknown })?.enabled;
  if (typeof enabled !== 'boolean') {
    return NextResponse.json({ error: 'Body must include boolean "enabled"' }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { notificationsEnabled: enabled },
  });

  return NextResponse.json({ success: true, enabled });
}
