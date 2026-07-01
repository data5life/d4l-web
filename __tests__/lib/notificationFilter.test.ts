import { describe, it, expect } from '@jest/globals';
import { shouldSendNotifications } from '@/lib/notificationFilter';

describe('shouldSendNotifications', () => {
  const prefs = (overrides: Record<string, boolean> = {}) =>
    Object.entries(overrides).map(([programId, enabled]) => ({ programId, enabled }));

  it('sends when global is enabled and no per-program preference exists', () => {
    expect(shouldSendNotifications(true, prefs(), 'prog-1')).toBe(true);
  });

  it('suppresses when global notifications are disabled, regardless of per-program prefs', () => {
    expect(shouldSendNotifications(false, prefs({ 'prog-1': true }), 'prog-1')).toBe(false);
    expect(shouldSendNotifications(false, prefs(), 'prog-1')).toBe(false);
  });

  it('suppresses when the user opted out of the specific program', () => {
    expect(shouldSendNotifications(true, prefs({ 'prog-1': false }), 'prog-1')).toBe(false);
  });

  it('honors prefs per program: opted-out suppressed, others default to enabled', () => {
    const p = prefs({ 'prog-1': false, 'prog-2': true });
    expect(shouldSendNotifications(true, p, 'prog-1')).toBe(false);
    expect(shouldSendNotifications(true, p, 'prog-2')).toBe(true);
    // A program with no stored preference falls back to enabled.
    expect(shouldSendNotifications(true, p, 'prog-3')).toBe(true);
  });
});
