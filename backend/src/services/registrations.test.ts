import { UniqueConstraintError } from 'sequelize';

const fakeT = { LOCK: { UPDATE: 'UPDATE' } };

jest.mock('../models', () => ({
  Event: { findOne: jest.fn() },
  Registration: { create: jest.fn() },
  sequelize: { transaction: jest.fn((cb: (t: typeof fakeT) => unknown) => cb(fakeT)) },
  withDeadlockRetry: jest.fn((fn: () => unknown) => fn()),
}));

import { Event, Registration } from '../models';
import { register } from './registrations';

const mockEvent = Event as jest.Mocked<typeof Event>;
const mockRegistration = Registration as jest.Mocked<typeof Registration>;

const EVENT_UUID = 'd39cf190-3b3b-42e1-ba29-aa1675f25a06';
const EMAIL = 'person@example.com';

function eventRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    uuid: EVENT_UUID,
    deadline: new Date('2099-01-01T00:00:00.000Z'),
    capacity: 10,
    registrationCount: 0,
    increment: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('register', () => {
  it('rejects an unknown event with 400', async () => {
    mockEvent.findOne.mockResolvedValueOnce(null);

    await expect(register(EVENT_UUID, EMAIL)).rejects.toMatchObject({
      status: 400,
      message: 'Event not found.',
    });
    expect(mockEvent.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ lock: fakeT.LOCK.UPDATE, transaction: fakeT }),
    );
  });

  it('rejects with 400 once the deadline has passed', async () => {
    mockEvent.findOne.mockResolvedValueOnce(
      eventRow({ deadline: new Date('2020-01-01T00:00:00.000Z') }) as never,
    );

    await expect(register(EVENT_UUID, EMAIL)).rejects.toMatchObject({
      status: 400,
      message: 'This event is closed for registration.',
    });
  });

  it('rejects with 400 once the event is full', async () => {
    mockEvent.findOne.mockResolvedValueOnce(
      eventRow({ registrationCount: 10, capacity: 10 }) as never,
    );

    await expect(register(EVENT_UUID, EMAIL)).rejects.toMatchObject({
      status: 400,
      message: 'This event is full.',
    });
  });

  it('on success creates the registration, increments the count and returns a padded number', async () => {
    const event = eventRow({ registrationCount: 4 });
    mockEvent.findOne.mockResolvedValueOnce(event as never);
    mockRegistration.create.mockResolvedValueOnce({} as never);

    const result = await register(EVENT_UUID, EMAIL);

    expect(result).toBe('00005');
    expect(mockRegistration.create).toHaveBeenCalledWith(
      { eventUuid: EVENT_UUID, emailAddress: EMAIL, registrationNo: 5 },
      { transaction: fakeT },
    );
    expect(event.increment).toHaveBeenCalledWith('registrationCount', {
      by: 1,
      transaction: fakeT,
    });
  });

  it('maps a uniq_event_email violation to 400 on emailAddress', async () => {
    mockEvent.findOne.mockResolvedValueOnce(eventRow() as never);
    mockRegistration.create.mockRejectedValueOnce(
      new UniqueConstraintError({ fields: { uniq_event_email: 'x' } }),
    );

    await expect(register(EVENT_UUID, EMAIL)).rejects.toMatchObject({
      status: 400,
      errors: { emailAddress: ['This email address is already registered for this event.'] },
    });
  });

  it('rethrows a uniq_event_registration_no violation unchanged', async () => {
    mockEvent.findOne.mockResolvedValueOnce(eventRow() as never);
    const boom = new UniqueConstraintError({ fields: { uniq_event_registration_no: 'x' } });
    mockRegistration.create.mockRejectedValueOnce(boom);

    await expect(register(EVENT_UUID, EMAIL)).rejects.toBe(boom);
  });

  it('rethrows any other error unchanged', async () => {
    mockEvent.findOne.mockResolvedValueOnce(eventRow() as never);
    const boom = new Error('db is on fire');
    mockRegistration.create.mockRejectedValueOnce(boom);

    await expect(register(EVENT_UUID, EMAIL)).rejects.toBe(boom);
  });
});
