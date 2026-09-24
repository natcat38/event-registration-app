import { Op } from 'sequelize';
import { openState, openWhere, parseCalendarDate, parseInstant, sgtDate } from './dates';

describe('parseCalendarDate', () => {
  it('maps a date to the start or end of that Singapore day', () => {
    expect(parseCalendarDate('2026-04-20', 'start')?.toISOString()).toBe(
      '2026-04-19T16:00:00.000Z',
    );
    expect(parseCalendarDate('2026-04-20', 'end')?.toISOString()).toBe('2026-04-20T15:59:59.999Z');
  });
  it('rejects anything that is not a real calendar date', () => {
    for (const bad of ['2026-02-30', '2026-13-01', '2026-4-20', '2026-04-20T10:00:00Z', 42, '']) {
      expect(parseCalendarDate(bad, 'end')).toBeNull();
    }
  });
  it('accepts years before 0100', () => {
    expect(parseCalendarDate('0099-06-15', 'start')?.toISOString()).toBe(
      '0099-06-14T16:00:00.000Z',
    );
  });
});

describe('parseInstant', () => {
  it('keeps an explicit offset and assumes Singapore without one', () => {
    expect(parseInstant('2026-04-25T18:00:00+08:00')?.toISOString()).toBe(
      '2026-04-25T10:00:00.000Z',
    );
    expect(parseInstant('2026-04-25T18:00:00Z')?.toISOString()).toBe('2026-04-25T18:00:00.000Z');
    expect(parseInstant('2026-04-25T18:00:00')?.toISOString()).toBe('2026-04-25T10:00:00.000Z');
    expect(parseInstant('2026-04-25 18:00')?.toISOString()).toBe('2026-04-25T10:00:00.000Z');
  });
  it('accepts basic-format offsets and lowercase t/z', () => {
    expect(parseInstant('2026-04-25T18:00:00+0800')?.toISOString()).toBe(
      '2026-04-25T10:00:00.000Z',
    );
    expect(parseInstant('2026-04-25t18:00:00z')?.toISOString()).toBe('2026-04-25T18:00:00.000Z');
  });
  it('treats a date-only value as the start of the Singapore day', () => {
    expect(parseInstant('2026-04-25')?.toISOString()).toBe('2026-04-24T16:00:00.000Z');
  });
  it('rejects garbage and rolled-over dates', () => {
    for (const bad of ['tomorrow', '2026-02-30T10:00:00Z', '2026-04-25T25:00:00Z', null]) {
      expect(parseInstant(bad)).toBeNull();
    }
  });
  it('accepts a negative offset', () => {
    expect(parseInstant('2026-04-25T18:00:00-05:00')?.toISOString()).toBe(
      '2026-04-25T23:00:00.000Z',
    );
  });
  it('returns null for non-string input', () => {
    for (const bad of [undefined, 12345, {}]) {
      expect(parseInstant(bad)).toBeNull();
    }
  });
});

describe('sgtDate', () => {
  it('rolls to the next calendar date after 16:00 UTC', () => {
    expect(sgtDate(new Date('2026-04-17T15:59:59.999Z'))).toBe('2026-04-17');
    expect(sgtDate(new Date('2026-04-17T16:30:00Z'))).toBe('2026-04-18');
  });
});

describe('openState', () => {
  const deadline = parseCalendarDate('2026-04-20', 'end')!;
  it('is closed once the deadline has passed, even with capacity left', () => {
    expect(
      openState({ deadline, capacity: 10, registrationCount: 1 }, new Date(deadline.getTime() + 1)),
    ).toBe('closed');
  });
  it('is full when at capacity before the deadline', () => {
    expect(openState({ deadline, capacity: 2, registrationCount: 2 }, deadline)).toBe('full');
  });
  it('is open otherwise', () => {
    expect(openState({ deadline, capacity: 2, registrationCount: 1 }, deadline)).toBe('open');
  });
});

describe('openWhere', () => {
  it('is an Op.and of the deadline and capacity conditions', () => {
    const now = new Date('2026-04-01T00:00:00.000Z');
    const clause = openWhere(now) as unknown as { [Op.and]: unknown[] };
    expect(clause[Op.and]).toHaveLength(2);
  });
});
