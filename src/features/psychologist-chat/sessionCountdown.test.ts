import { describe, it, expect } from 'vitest';
import { formatCountdown, sessionStartIso } from './SessionCountdown';

describe('Session countdown (WIB)', () => {
  it('builds a WIB instant from a booking date and slot time', () => {
    expect(sessionStartIso('2026-11-26', '10:00:00')).toBe('2026-11-26T10:00:00+07:00');
    expect(new Date(sessionStartIso('2026-11-26', '10:00:00')).toISOString()).toBe(
      '2026-11-26T03:00:00.000Z'
    );
  });

  it('formats remaining time as days/hours/minutes without seconds noise', () => {
    expect(formatCountdown(0)).toBe('0 m');
    expect(formatCountdown(45 * 60000)).toBe('45 m');
    expect(formatCountdown((2 * 60 + 5) * 60000)).toBe('2 j 5 m');
    expect(formatCountdown((26 * 60 + 50) * 60000)).toBe('1 hr 2 j');
  });

  it('clamps past slots to zero instead of negative countdowns', () => {
    expect(formatCountdown(-5 * 60000)).toBe('0 m');
  });
});