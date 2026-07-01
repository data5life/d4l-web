// Token-gated unsubscribe endpoint.
//
// POST /api/notifications/unsubscribe?token=...
//   RFC 8058 one-click target invoked by email clients. Always disables
//   reminders for the (userId, programId) encoded in the token.
//
// POST /api/notifications/unsubscribe   (JSON body)
//   Used by the landing page's resubscribe / unsub-all buttons.
//   Body: { token: string, scope?: 'program' | 'global', enabled?: boolean }
//   Defaults: scope='program', enabled=false.

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyUnsubscribeToken } from '@/lib/unsubscribeToken';

async function readToken(req: NextRequest): Promise<{
  token: string | null;
  scope: 'program' | 'global';
  enabled: boolean;
}> {
  // Query-string token wins (one-click POST from mail clients sends no body).
  const queryToken = req.nextUrl.searchParams.get('token');
  if (queryToken) {
    return { token: queryToken, scope: 'program', enabled: false };
  }

  const contentType = req.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      const body = (await req.json()) as {
        token?: unknown;
        scope?: unknown;
        enabled?: unknown;
      };
      const token = typeof body.token === 'string' ? body.token : null;
      const scope = body.scope === 'global' ? 'global' : 'program';
      const enabled = body.enabled === true;
      return { token, scope, enabled };
    } catch {
      return { token: null, scope: 'program', enabled: false };
    }
  }

  return { token: null, scope: 'program', enabled: false };
}

export async function POST(req: NextRequest) {
  const { token, scope, enabled } = await readToken(req);
  if (!token) {
    return NextResponse.json({ error: 'Missing token' }, { status: 400 });
  }

  const payload = verifyUnsubscribeToken(token);
  if (!payload) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true },
  });
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  if (scope === 'global') {
    await prisma.user.update({
      where: { id: user.id },
      data: { notificationsEnabled: enabled },
    });
    return NextResponse.json({ success: true, scope, enabled });
  }

  await prisma.notificationPreference.upsert({
    where: {
      userId_programId: { userId: user.id, programId: payload.programId },
    },
    create: { userId: user.id, programId: payload.programId, enabled },
    update: { enabled },
  });

  return NextResponse.json({
    success: true,
    scope,
    programId: payload.programId,
    enabled,
  });
}
