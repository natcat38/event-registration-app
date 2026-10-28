import { describe, expect, it } from 'vitest';
import type { TrendPoint } from '../api/client';
import { summarizeTrend } from './trendSummary';

const point = (
  date: string,
  registrationCount: number,
  newRegistrationCount: number,
): TrendPoint => ({
  date,
  registrationCount,
  newRegistrationCount,
});

describe('summarizeTrend', () => {
  it('reports the total, the first busiest day and the seats left', () => {
    const trend = [
      point('2026-10-01', 2, 2),
      point('2026-10-02', 7, 5),
      point('2026-10-03', 12, 5),
      point('2026-10-04', 12, 0),
    ];
    expect(summarizeTrend(trend, 20)).toEqual({
      total: 12,
      peak: { date: '2026-10-02', count: 5 },
      seatsLeft: 8,
    });
  });

  it('has no peak day when nobody registered', () => {
    const trend = [point('2026-10-01', 0, 0), point('2026-10-02', 0, 0)];
    expect(summarizeTrend(trend, 10)).toEqual({ total: 0, peak: null, seatsLeft: 10 });
  });

  it('never reports negative seats', () => {
    expect(summarizeTrend([point('2026-10-01', 9, 9)], 5).seatsLeft).toBe(0);
  });

  it('copes with an empty trend', () => {
    expect(summarizeTrend([], 5)).toEqual({ total: 0, peak: null, seatsLeft: 5 });
  });
});
