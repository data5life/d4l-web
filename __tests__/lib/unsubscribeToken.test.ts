import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { createUnsubscribeToken, verifyUnsubscribeToken } from '@/lib/unsubscribeToken';

describe('unsubscribeToken', () => {
  const original = process.env.AUTH_SECRET;

  beforeAll(() => {
    process.env.AUTH_SECRET = 'test-secret-for-tokens';
  });

  afterAll(() => {
    process.env.AUTH_SECRET = original;
  });

  it('round-trips a valid token', () => {
    const token = createUnsubscribeToken({
      userId: 'user_123',
      programId: 'prog_abc',
    });
    expect(verifyUnsubscribeToken(token)).toEqual({
      userId: 'user_123',
      programId: 'prog_abc',
    });
  });

  it('rejects tokens whose signature was tampered with', () => {
    const token = createUnsubscribeToken({
      userId: 'u',
      programId: 'p',
    });
    const tampered = token.slice(0, -1) + (token.endsWith('0') ? '1' : '0');
    expect(verifyUnsubscribeToken(tampered)).toBeNull();
  });

  it('rejects tokens whose payload was tampered with', () => {
    const token = createUnsubscribeToken({
      userId: 'alice',
      programId: 'study1',
    });
    const [, sig] = token.split('.');
    const fakePayload = Buffer.from('eve:study1', 'utf8')
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    expect(verifyUnsubscribeToken(`${fakePayload}.${sig}`)).toBeNull();
  });

  it('rejects tokens signed with a different secret', () => {
    const token = createUnsubscribeToken({
      userId: 'u',
      programId: 'p',
    });
    process.env.AUTH_SECRET = 'something-else';
    try {
      expect(verifyUnsubscribeToken(token)).toBeNull();
    } finally {
      process.env.AUTH_SECRET = 'test-secret-for-tokens';
    }
  });

  it('rejects malformed tokens', () => {
    expect(verifyUnsubscribeToken('')).toBeNull();
    expect(verifyUnsubscribeToken('no-separator')).toBeNull();
    expect(verifyUnsubscribeToken('.')).toBeNull();
    expect(verifyUnsubscribeToken('garbage.deadbeef')).toBeNull();
  });

  it('throws when ids contain the separator', () => {
    expect(() => createUnsubscribeToken({ userId: 'a:b', programId: 'p' })).toThrow();
    expect(() => createUnsubscribeToken({ userId: 'u', programId: 'a:b' })).toThrow();
  });
});
