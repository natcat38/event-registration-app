import { UniqueConstraintError, type FindOptions } from 'sequelize';
import { Event, Handler, sequelize, withDeadlockRetry } from '../models';
import { openWhere, sgtDate } from '../utils/dates';
import { AppError } from '../utils/errors';
import type { CreateEventInput } from '../validation/schemas';
import { lookupAddress } from './onemap';

export interface PublicEventDto {
  uuid: string;
  name: string;
  dateTime: string;
  address: string;
  deadline: string;
}

export const PUBLIC_EVENT_ATTRIBUTES = ['uuid', 'name', 'dateTime', 'address', 'deadline'] as const;

/** The five spec fields, shared by the public list and the admin list. see docs/adr/0003 for formats */
export function toPublicEventDto(event: Event): PublicEventDto {
  return {
    uuid: event.uuid,
    name: event.name,
    dateTime: event.dateTime.toISOString(),
    address: event.address,
    deadline: sgtDate(event.deadline),
  };
}

export async function listOpenEvents(now: Date = new Date()): Promise<PublicEventDto[]> {
  const events = await Event.findAll({
    attributes: [...PUBLIC_EVENT_ATTRIBUTES],
    where: openWhere(now),
    order: [['dateTime', 'ASC']],
  });
  return events.map(toPublicEventDto);
}

/** `{ uuid, name }[]` ordered by name; feeds the admin create-event form. see docs/adr/0008 */
export async function listHandlers(): Promise<{ uuid: string; name: string }[]> {
  const handlers = await Handler.findAll({ order: [['name', 'ASC']] });
  return handlers.map((h) => ({ uuid: h.uuid, name: h.name }));
}

async function findHandlerOrThrow(uuid: string, options?: FindOptions<Handler>): Promise<Handler> {
  const handler = await Handler.findByPk(uuid, options);
  if (!handler) throw AppError.field(400, 'handlerUuid', 'Handler not found.');
  return handler;
}

/** Creates an admin event. see docs/adr/0004 for the locking shape and docs/adr/0005 for OneMap. */
export async function createEvent(input: CreateEventInput): Promise<void> {
  // Cheap check first so an unknown handler never costs a OneMap call; the locked check is authoritative.
  await findHandlerOrThrow(input.handlerUuid);
  const address = await lookupAddress(input.postalCode);
  if (!address) throw AppError.field(400, 'postalCode', 'Postal code not found.');

  await withDeadlockRetry(() =>
    sequelize.transaction(async (t) => {
      await findHandlerOrThrow(input.handlerUuid, { lock: t.LOCK.UPDATE, transaction: t });
      // see docs/adr/0004: now is captured here, after the lock, never at request arrival.
      const now = new Date();
      // No lock here: the handler row lock above already serialises creates for this handler,
      // and a locked range scan would take gap locks across all of its events.
      const openEvent = await Event.findOne({
        where: { handlerUuid: input.handlerUuid, ...openWhere(now) },
        transaction: t,
      });
      if (openEvent) {
        throw AppError.field(400, 'handlerUuid', 'This handler already has an open event.');
      }
      try {
        await Event.create({ ...input, address }, { transaction: t });
      } catch (err) {
        if (err instanceof UniqueConstraintError) {
          throw AppError.field(400, 'name', 'An event with this name already exists.');
        }
        throw err;
      }
    }),
  );
}
