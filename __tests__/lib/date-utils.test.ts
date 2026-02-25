import { isIsoDate, formatDeadline } from '@/lib/date-utils';

describe('isIsoDate', () => {
  it('returns true for valid YYYY-MM-DD', () => {
    expect(isIsoDate('2026-02-15')).toBe(true);
    expect(isIsoDate('2025-12-31')).toBe(true);
    expect(isIsoDate('2026-01-01')).toBe(true);
  });

  it('returns false for invalid dates', () => {
    expect(isIsoDate('2026-13-01')).toBe(false);
    expect(isIsoDate('2026-02-30')).toBe(false);
  });

  it('returns false for non-date strings', () => {
    expect(isIsoDate('Feb 15')).toBe(false);
    expect(isIsoDate('next Friday')).toBe(false);
    expect(isIsoDate('')).toBe(false);
    expect(isIsoDate('2026-1-1')).toBe(false);
  });

  it('returns false for date-like but wrong format', () => {
    expect(isIsoDate('02/15/2026')).toBe(false);
    expect(isIsoDate('2026/02/15')).toBe(false);
  });
});

describe('formatDeadline', () => {
  it('formats ISO dates as human-readable', () => {
    expect(formatDeadline('2026-02-15')).toBe('Feb 15, 2026');
    expect(formatDeadline('2026-12-25')).toBe('Dec 25, 2026');
    expect(formatDeadline('2025-01-01')).toBe('Jan 1, 2025');
  });

  it('passes through legacy freeform strings unchanged', () => {
    expect(formatDeadline('Feb 1')).toBe('Feb 1');
    expect(formatDeadline('next Friday')).toBe('next Friday');
    expect(formatDeadline('ASAP')).toBe('ASAP');
  });

  it('returns empty string for null', () => {
    expect(formatDeadline(null)).toBe('');
  });

  it('returns empty string for empty string', () => {
    expect(formatDeadline('')).toBe('');
  });
});
