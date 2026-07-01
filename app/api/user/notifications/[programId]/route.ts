import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

/** Toggle notifications for a single program. Requires an active enrollment. */
export async function PATCH(req: Request, { params }: { params: Promise<{ programId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { programId } = await params;
  if (!programId) {
    return NextResponse.json({ error: 'Missing programId' }, { status: 400 });
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

  // Confirm enrollment directly (no indirection through the user / consents).
  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_programId: { userId: session.user.id, programId } },
    select: { id: true },
  });

  if (!enrollment) {
    return NextResponse.json({ error: 'Not enrolled in this program' }, { status: 403 });
  }

  await prisma.notificationPreference.upsert({
    where: { userId_programId: { userId: session.user.id, programId } },
    create: { userId: session.user.id, programId, enabled },
    update: { enabled },
  });

  return NextResponse.json({ success: true, programId, enabled });
}
