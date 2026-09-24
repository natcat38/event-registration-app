import { UniqueConstraintError } from 'sequelize';
import { Event, Registration, sequelize, withDeadlockRetry } from '../models';
import { openState } from '../utils/dates';
import { AppError } from '../utils/errors';

const CLOSED_MESSAGE = {
  closed: 'This event is closed for registration.',
  full: 'This event is full.',
};

// see docs/adr/0004: one locked transaction, re-checked under the row lock.
export async function register(eventUuid: string, emailAddress: string): Promise<string> {
  return withDeadlockRetry(() =>
    sequelize.transaction(async (t) => {
      try {
        const event = await Event.findOne({
          where: { uuid: eventUuid },
          lock: t.LOCK.UPDATE,
          transaction: t,
        });
        if (!event) throw new AppError(400, 'Event not found.');

        // see docs/adr/0003: now is captured after the locked read, never at request arrival.
        const state = openState(event, new Date());
        if (state !== 'open') throw new AppError(400, CLOSED_MESSAGE[state]);

        const registrationNo = event.registrationCount + 1;
        await Registration.create({ eventUuid, emailAddress, registrationNo }, { transaction: t });
        await event.increment('registrationCount', { by: 1, transaction: t });
        return String(registrationNo).padStart(5, '0');
      } catch (err) {
        // Always rethrow: a managed transaction commits on return and rolls back on throw.
        if (err instanceof UniqueConstraintError && isEmailUniqueViolation(err)) {
          throw AppError.field(
            400,
            'emailAddress',
            'This email address is already registered for this event.',
          );
        }
        throw err;
      }
    }),
  );
}

// Depends on the index being named uniq_event_email (mysql2 keys `fields` by index name).
// Any other unique violation (uniq_event_registration_no) is a counter bug and must stay a 500.
function isEmailUniqueViolation(err: UniqueConstraintError): boolean {
  const fields = err.fields ? Object.keys(err.fields) : [];
  if (fields.some((f) => f.toLowerCase().includes('email'))) return true;
  const sqlMessage = (err.original as { sqlMessage?: string } | undefined)?.sqlMessage ?? '';
  return sqlMessage.includes('uniq_event_email');
}
