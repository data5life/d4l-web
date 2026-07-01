import { describe, it, expect } from '@jest/globals';
import { applyOffsetLocalized, extractSnapTime } from '@/lib/evaluateTasks';

describe('applyOffsetLocalized', () => {
  const TZ = 'Europe/Berlin';

  describe('with snapTime', () => {
    const snapTime = { hour: 9, minute: 0, second: 0 };

    it('snaps to 09:00 on the next calendar day regardless of base time', () => {
      const base = new Date('2024-03-10T21:00:00Z'); // 10pm Berlin
      const result = applyOffsetLocalized(base, 'P1D', TZ, snapTime);
      const local = result.toLocaleString('en-GB', { timeZone: TZ });
      expect(local).toMatch(/11\/03\/2024/); // next day
      expect(
        result.toLocaleTimeString('en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit' }),
      ).toBe('09:00');
    });

    it('snaps to 09:00 on the next calendar day handling midnight crossing', () => {
      const base = new Date('2024-03-10T23:00:00Z'); // midnight Berlin
      const result = applyOffsetLocalized(base, 'P1D', TZ, snapTime);
      const local = result.toLocaleString('en-GB', { timeZone: TZ });
      expect(local).toMatch(/12\/03\/2024/); // next day
      expect(
        result.toLocaleTimeString('en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit' }),
      ).toBe('09:00');
    });

    it('produces the same result regardless of what time the base date is', () => {
      const morning = new Date('2024-03-10T06:00:00Z');
      const evening = new Date('2024-03-10T20:00:00Z');
      const r1 = applyOffsetLocalized(morning, 'P1D', TZ, snapTime);
      const r2 = applyOffsetLocalized(evening, 'P1D', TZ, snapTime);
      expect(r1.getTime()).toBe(r2.getTime());
    });

    it('handles DST spring-forward correctly (clocks go forward on 2024-03-31 in Berlin)', () => {
      // Base is just before DST transition
      const base = new Date('2024-03-30T12:00:00Z');
      const result = applyOffsetLocalized(base, 'P1D', TZ, snapTime);
      // Should still be 09:00 local, not 08:00 or 10:00
      expect(
        result.toLocaleTimeString('en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit' }),
      ).toBe('09:00');
    });

    it('handles multi-day offsets', () => {
      const base = new Date('2024-03-10T14:00:00Z');
      const result = applyOffsetLocalized(base, 'P3D', TZ, snapTime);
      const dateStr = result.toLocaleDateString('en-GB', { timeZone: TZ });
      expect(dateStr).toBe('13/03/2024');
    });

    it('handles week offsets', () => {
      const base = new Date('2024-03-10T14:00:00Z'); // Sunday
      const result = applyOffsetLocalized(base, 'P1W', TZ, snapTime);
      const dateStr = result.toLocaleDateString('en-GB', { timeZone: TZ });
      expect(dateStr).toBe('17/03/2024');
    });
  });

  describe('without snapTime (raw calendar-aware shift)', () => {
    it('preserves the time of day of the base date', () => {
      const base = new Date('2024-03-10T14:30:00+01:00'); // 14:30 Berlin
      const result = applyOffsetLocalized(base, 'P1D', TZ);
      expect(
        result.toLocaleTimeString('en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit' }),
      ).toBe('14:30');
    });

    it('handles DST spring-forward without snapping', () => {
      // 2024-03-30 at 14:00 Berlin → +1D should be 2024-03-31 14:00 (still 14:00 despite DST)
      const base = new Date('2024-03-30T13:00:00Z'); // 14:00 Berlin (UTC+1)
      const result = applyOffsetLocalized(base, 'P1D', TZ);
      expect(
        result.toLocaleTimeString('en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit' }),
      ).toBe('14:00');
    });
  });
});

describe('extractSnapTime', () => {
  it('extracts hour, minute, second from an ISO 8601 date string', () => {
    const result = extractSnapTime('2024-03-01T09:15:30+01:00');
    expect(result).toEqual({ hour: 9, minute: 15, second: 30 });
  });

  it('extracts the same time regardless of timezone offset', () => {
    const berlin = extractSnapTime('2024-03-01T09:00:00+01:00');
    const utc = extractSnapTime('2024-03-01T09:00:00+00:00');
    expect(berlin).toEqual(utc);
  });
});
