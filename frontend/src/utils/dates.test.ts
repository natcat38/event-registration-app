import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { isOpen } from './dates';

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
