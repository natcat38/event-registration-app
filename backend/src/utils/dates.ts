import { Op, col, where } from 'sequelize';

// see docs/adr/0003: the only place a user string becomes a Date.
const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;
const ISO_DATETIME =
  /^(\d{4})-(\d{2})-(\d{2})[T ]\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?$/i;
const HAS_OFFSET = /(Z|[+-]\d{2}:?\d{2})$/i;
const SGT_MS = 8 * 60 * 60 * 1000;

function isRealCalendarDate(y: number, m: number, d: number): boolean {
  const probe = new Date(0);
  probe.setUTCFullYear(y, m - 1, d);
  return probe.getUTCFullYear() === y && probe.getUTCMonth() === m - 1 && probe.getUTCDate() === d;
}

/** `YYYY-MM-DD` only. Returns the instant at the start or end of that Singapore day, else null. */
export function parseCalendarDate(s: unknown, edge: 'start' | 'end'): Date | null {
  if (typeof s !== 'string') return null;
  const m = DATE_ONLY.exec(s.trim());
  if (!m || !isRealCalendarDate(Number(m[1]), Number(m[2]), Number(m[3]))) return null;
  const suffix = edge === 'end' ? 'T23:59:59.999+08:00' : 'T00:00:00.000+08:00';
  return new Date(m[0] + suffix);
}

/** Date-only (start of the Singapore day) or ISO date-time; no offset means Singapore time. */
export function parseInstant(s: unknown): Date | null {
  if (typeof s !== 'string') return null;
  const t = s.trim();
  if (DATE_ONLY.test(t)) return parseCalendarDate(t, 'start');
  const m = ISO_DATETIME.exec(t);
  if (!m || !isRealCalendarDate(Number(m[1]), Number(m[2]), Number(m[3]))) return null;
  const iso = (HAS_OFFSET.test(t) ? t : `${t}+08:00`).replace(' ', 'T').toUpperCase();
  const d = new Date(iso.replace(/([+-]\d{2})(\d{2})$/, '$1:$2'));
  return Number.isNaN(d.getTime()) ? null : d;
}

/** The Singapore calendar date of an instant, `YYYY-MM-DD`. */
export function sgtDate(d: Date): string {
  return new Date(d.getTime() + SGT_MS).toISOString().slice(0, 10);
}

export interface OpenEventLike {
  deadline: Date;
  registrationCount: number;
  capacity: number;
}

export type OpenState = 'open' | 'closed' | 'full';

/** One definition of "open"; `openWhere` below is the same rule for SQL. Deadline is checked first. */
export function openState(event: OpenEventLike, now: Date): OpenState {
  if (now > event.deadline) return 'closed';
  if (event.registrationCount >= event.capacity) return 'full';
  return 'open';
}

export function openWhere(now: Date) {
  return {
    [Op.and]: [
      where(col('Event.deadline'), Op.gte, now),
      where(col('Event.registrationCount'), Op.lt, col('Event.capacity')),
    ],
  };
}
