import { Op, col, where as sqlWhere, type WhereOptions } from 'sequelize';
import { Event, Handler } from '../models';
import { openWhere } from '../utils/dates';
import type { AdminEventsQuery } from '../validation/schemas';
import { toPublicEventDto, type PublicEventDto } from './events';

export const PAGE_SIZE = 10; // mirrored in frontend/src/pages/useAdminEvents.ts, see docs/adr/0001

export interface AdminEventDto extends PublicEventDto {
  createdAt: string;
  capacity: number;
  registrationCount: number;
  handler: { uuid: string; name: string };
}

export interface AdminEventsResult {
  total: number;
  events: AdminEventDto[];
}

// MySQL LIKE treats % and _ as wildcards and \ as the escape, so all three are escaped.
function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (c) => `\\${c}`);
}

function toDto(event: Event): AdminEventDto {
  return {
    ...toPublicEventDto(event),
    createdAt: event.createdAt.toISOString(),
    capacity: event.capacity,
    registrationCount: event.registrationCount,
    handler: { uuid: event.Handler!.uuid, name: event.Handler!.name },
  };
}

/** Paginated admin list; `total` counts matches before paging. Search spans name, address and handler. */
export async function listAdminEvents(
  query: AdminEventsQuery,
  now: Date = new Date(),
): Promise<AdminEventsResult> {
  const conditions: WhereOptions[] = [];
  if (query.open) conditions.push(openWhere(now));
  if (query.search) {
    const pattern = `%${escapeLike(query.search)}%`;
    conditions.push({
      [Op.or]: [
        { name: { [Op.like]: pattern } },
        { address: { [Op.like]: pattern } },
        sqlWhere(col('Handler.name'), Op.like, pattern),
      ],
    });
  }
  const { rows, count } = await Event.findAndCountAll({
    where: conditions.length > 0 ? { [Op.and]: conditions } : undefined,
    include: [{ model: Handler, required: true }],
    subQuery: false, // limit/offset with a join mis-paginates under Sequelize's default subquery
    order: [
      ['createdAt', 'DESC'],
      ['uuid', 'ASC'],
    ],
    limit: PAGE_SIZE,
    offset: (query.page - 1) * PAGE_SIZE,
  });
  return { total: count, events: rows.map(toDto) };
}
