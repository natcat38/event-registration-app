import { buildTrend } from './trend';

describe('buildTrend', () => {
  it('fills every date in range and zero-fills gaps', () => {
    expect(buildTrend('2026-04-18', '2026-04-20', { '2026-04-19': 3 })).toEqual([
      { date: '2026-04-18', registrationCount: 0, newRegistrationCount: 0 },
      { date: '2026-04-19', registrationCount: 3, newRegistrationCount: 3 },
      { date: '2026-04-20', registrationCount: 3, newRegistrationCount: 0 },
    ]);
  });

  it('accumulates across days', () => {
    const out = buildTrend('2026-04-18', '2026-04-20', {
      '2026-04-18': 2,
      '2026-04-19': 1,
      '2026-04-20': 5,
    });
    expect(out.map((r) => r.registrationCount)).toEqual([2, 3, 8]);
  });

  it('coerces string counts from raw SQL to numbers', () => {
    const out = buildTrend('2026-04-20', '2026-04-20', { '2026-04-20': '7' as unknown as number });
    expect(out[0].newRegistrationCount).toBe(7);
  });

  it('returns one creation-date row when the deadline predates creation', () => {
    expect(buildTrend('2026-04-21', '2026-04-20', { '2026-04-21': 2 })).toEqual([
      { date: '2026-04-21', registrationCount: 2, newRegistrationCount: 2 },
    ]);
  });

  it('matches the worked example in the tech scope', () => {
    const out = buildTrend('2026-04-15', '2026-04-20', { '2026-04-18': 2 });
    expect(out.map((r) => r.registrationCount)).toEqual([0, 0, 0, 2, 2, 2]);
    expect(out.map((r) => r.newRegistrationCount)).toEqual([0, 0, 0, 2, 0, 0]);
  });
});
