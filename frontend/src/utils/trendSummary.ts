import type { TrendPoint } from '../api/client';

export interface TrendSummary {
  total: number;
  /** The day with the most new sign-ups; null when nobody has registered. */
  peak: { date: string; count: number } | null;
  seatsLeft: number;
}

/** One-line facts above the trend table: how many signed up, the busiest day, seats still free. */
export function summarizeTrend(trend: TrendPoint[], capacity: number): TrendSummary {
  const total = trend.length > 0 ? trend[trend.length - 1].registrationCount : 0;
  let peak: TrendSummary['peak'] = null;
  for (const point of trend) {
    if (point.newRegistrationCount > (peak?.count ?? 0)) {
      peak = { date: point.date, count: point.newRegistrationCount };
    }
  }
  return { total, peak, seatsLeft: Math.max(0, capacity - total) };
}
