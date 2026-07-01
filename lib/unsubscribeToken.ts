// Stateless unsubscribe tokens for notification emails.
// Format: `${base64url(userId:programId)}.${hmacHex}`
// Signed with AUTH_SECRET. Tokens never expire — they only unsubscribe from
// reminder emails, and a permanent link means old emails keep working.

import { createHmac, timingSafeEqual } from 'node:crypto';

const SEPARATOR = '.';

function getSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error('AUTH_SECRET is not configured');
  }
  return secret;
}

function base64UrlEncode(input: string): string {
  return Buffer.from(input, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64UrlDecode(input: string): string {
  const padded = input + '='.repeat((4 - (input.length % 4)) % 4);
  const base64 = padded.replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(base64, 'base64').toString('utf8');
}

function sign(payload: string): string {
  return createHmac('sha256', getSecret()).update(payload).digest('hex');
}

interface UnsubscribePayload {
  userId: string;
  programId: string;
}

export function createUnsubscribeToken({ userId, programId }: UnsubscribePayload): string {
  if (userId.includes(':') || programId.includes(':')) {
    throw new Error('userId and programId must not contain ":"');
  }
  const payload = `${userId}:${programId}`;
  const encoded = base64UrlEncode(payload);
  const signature = sign(encoded);
  return `${encoded}${SEPARATOR}${signature}`;
}

export function verifyUnsubscribeToken(token: string): UnsubscribePayload | null {
  if (typeof token !== 'string' || !token.includes(SEPARATOR)) {
    return null;
  }
  const idx = token.lastIndexOf(SEPARATOR);
  const encoded = token.slice(0, idx);
  const signature = token.slice(idx + 1);

  if (!encoded || !signature) return null;

  let expected: string;
  try {
    expected = sign(encoded);
  } catch {
    return null;
  }

  if (signature.length !== expected.length) return null;

  let ok = false;
  try {
    ok = timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expected, 'hex'));
  } catch {
    return null;
  }
  if (!ok) return null;

  let payload: string;
  try {
    payload = base64UrlDecode(encoded);
  } catch {
    return null;
  }

  const parts = payload.split(':');
  if (parts.length !== 2) return null;
  const [userId, programId] = parts;
  if (!userId || !programId) return null;

  return { userId, programId };
}
