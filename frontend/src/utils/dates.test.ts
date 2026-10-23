import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { formatDate, formatInstantDate, isOpen } from './dates';

describe('isOpen', () => {
  beforeEach(() => {
    // Fixed clock: 2026-04-20 10:00 UTC = 2026-04-20 18:00 SGT.
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-20T10:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('is open when the deadline is still ahead and capacity is not reached', () => {
    expect(isOpen({ deadline: '2026-04-21', capacity: 10, registrationCount: 5 })).toBe(true);
  });

  it('stays open through the last moment of the deadline day in SGT, not UTC midnight', () => {
    // 2026-04-20 23:59:59.999 SGT is still 2026-04-20 15:59:59.999 UTC.
    // `new Date('2026-04-20')` (UTC midnight) would have already closed this.
    vi.setSystemTime(new Date('2026-04-20T15:59:59.999Z'));
    expect(isOpen({ deadline: '2026-04-20', capacity: 10, registrationCount: 5 })).toBe(true);
  });

  it('closes the instant the deadline day ends in SGT', () => {
    vi.setSystemTime(new Date('2026-04-20T16:00:00.000Z'));
    expect(isOpen({ deadline: '2026-04-20', capacity: 10, registrationCount: 5 })).toBe(false);
  });

  it('is closed once capacity is reached, even before the deadline', () => {
    expect(isOpen({ deadline: '2026-04-25', capacity: 5, registrationCount: 5 })).toBe(false);
  });
});

describe('formatDate', () => {
  it('prints a calendar date in the same style as formatDateTime', () => {
    expect(formatDate('2027-01-11')).toBe('11 Jan 2027');
  });

  it('never shifts the day, whatever the machine timezone is', () => {
    expect(formatDate('2026-12-31')).toBe('31 Dec 2026');
    expect(formatDate('2026-03-01')).toBe('1 Mar 2026');
  });
});

describe('formatInstantDate', () => {
  it('uses the Singapore day, which is ahead of UTC late in the evening', () => {
    expect(formatInstantDate('2026-10-21T17:00:00.000Z')).toBe('22 Oct 2026');
  });
});
