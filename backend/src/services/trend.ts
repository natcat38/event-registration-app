import { QueryTypes } from 'sequelize';
import { Event, sequelize } from '../models';
import { sgtDate } from '../utils/dates';
import { AppError } from '../utils/errors';

export interface TrendPoint {
  date: string;
  registrationCount: number;
  newRegistrationCount: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Pure: one row per date from start to end inclusive, gaps zero-filled, running total. */
export function buildTrend(
  startDate: string,
  endDate: string,
  countsByDate: Record<string, number>,
): TrendPoint[] {
  const points: TrendPoint[] = [];
  let cumulative = 0;
  let cursor = new Date(`${startDate}T00:00:00.000Z`);
  // A deadline before the creation date still yields one row, for the creation date.
  const rawEnd = new Date(`${endDate}T00:00:00.000Z`);
  const end = rawEnd < cursor ? cursor : rawEnd;
  while (cursor <= end) {
    const date = cursor.toISOString().slice(0, 10);
    const newRegistrationCount = Number(countsByDate[date] ?? 0);
    cumulative += newRegistrationCount;
    points.push({ date, registrationCount: cumulative, newRegistrationCount });
    cursor = new Date(cursor.getTime() + DAY_MS);
  }
  return points;
}

interface TrendRow {
  date: string;
  count: number | string;
}

/** Trend from the event's creation date to its deadline, both as Singapore dates. see docs/adr/0003 */
export async function getEventTrend(eventUuid: string): Promise<TrendPoint[]> {
  const event = await Event.findByPk(eventUuid, { attributes: ['uuid', 'createdAt', 'deadline'] });
  if (!event) throw new AppError(400, 'Event not found.');

  // Numeric offsets only: named zones need MySQL's timezone tables, which the image lacks.
  const rows = await sequelize.query<TrendRow>(
    `SELECT DATE(CONVERT_TZ(createdAt, '+00:00', '+08:00')) AS date, COUNT(uuid) AS count
     FROM registrations WHERE eventUuid = :eventUuid
     GROUP BY DATE(CONVERT_TZ(createdAt, '+00:00', '+08:00'))`,
    { replacements: { eventUuid }, type: QueryTypes.SELECT },
  );
  const countsByDate: Record<string, number> = {};
  for (const row of rows) {
    countsByDate[String(row.date).slice(0, 10)] = Number(row.count);
  }
  return buildTrend(sgtDate(event.createdAt), sgtDate(event.deadline), countsByDate);
}
