import { UniqueConstraintError } from 'sequelize';
import type { CreateEventInput } from '../validation/schemas';

const fakeT = { LOCK: { UPDATE: 'UPDATE' } };

jest.mock('../models', () => ({
  Event: { findOne: jest.fn(), findAll: jest.fn(), create: jest.fn() },
  Handler: { findByPk: jest.fn(), findAll: jest.fn() },
  sequelize: { transaction: jest.fn((cb: (t: typeof fakeT) => unknown) => cb(fakeT)) },
  withDeadlockRetry: jest.fn((fn: () => unknown) => fn()),
}));
jest.mock('./onemap');

import { Event, Handler } from '../models';
import { lookupAddress } from './onemap';
import { createEvent, listHandlers, listOpenEvents } from './events';

const mockEvent = Event as jest.Mocked<typeof Event>;
const mockHandler = Handler as jest.Mocked<typeof Handler>;
const mockLookupAddress = lookupAddress as jest.MockedFunction<typeof lookupAddress>;

const HANDLER_UUID = 'd39cf190-3b3b-42e1-ba29-aa1675f25a06';
const ADDRESS = '10 BAYFRONT AVENUE SINGAPORE 018956';
const handlerRow = { uuid: HANDLER_UUID, name: 'Alice Tan' };

const input: CreateEventInput = {
  name: 'Career Fair',
  dateTime: new Date('2026-04-20T02:00:00.000Z'),
  postalCode: '018956',
  deadline: new Date('2026-04-19T15:59:59.999Z'),
  capacity: 100,
  handlerUuid: HANDLER_UUID,
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('createEvent', () => {
  it('rejects an unknown handler before calling OneMap', async () => {
    mockHandler.findByPk.mockResolvedValueOnce(null);

    await expect(createEvent(input)).rejects.toMatchObject({
      status: 400,
      errors: { handlerUuid: ['Handler not found.'] },
    });
    expect(mockLookupAddress).not.toHaveBeenCalled();
  });

  it('returns 400 on postalCode when OneMap finds no address', async () => {
    mockHandler.findByPk.mockResolvedValue(handlerRow as never);
    mockLookupAddress.mockResolvedValueOnce(null);

    await expect(createEvent(input)).rejects.toMatchObject({
      status: 400,
      errors: { postalCode: ['Postal code not found.'] },
    });
  });

  it('returns 400 on handlerUuid when the handler already has an open event', async () => {
    mockHandler.findByPk.mockResolvedValue(handlerRow as never);
    mockLookupAddress.mockResolvedValueOnce(ADDRESS);
    mockEvent.findOne.mockResolvedValueOnce({ uuid: 'existing' } as never);

    await expect(createEvent(input)).rejects.toMatchObject({
      status: 400,
      errors: { handlerUuid: ['This handler already has an open event.'] },
    });
  });

  it('returns 400 on name for a duplicate event name', async () => {
    mockHandler.findByPk.mockResolvedValue(handlerRow as never);
    mockLookupAddress.mockResolvedValueOnce(ADDRESS);
    mockEvent.findOne.mockResolvedValueOnce(null);
    mockEvent.create.mockRejectedValueOnce(new UniqueConstraintError({ fields: { name: 'x' } }));

    await expect(createEvent(input)).rejects.toMatchObject({
      status: 400,
      errors: { name: ['An event with this name already exists.'] },
    });
  });

  it('rethrows any other error from Event.create', async () => {
    mockHandler.findByPk.mockResolvedValue(handlerRow as never);
    mockLookupAddress.mockResolvedValueOnce(ADDRESS);
    mockEvent.findOne.mockResolvedValueOnce(null);
    const boom = new Error('db is on fire');
    mockEvent.create.mockRejectedValueOnce(boom);

    await expect(createEvent(input)).rejects.toBe(boom);
  });

  it('on success looks up the handler under the lock and creates the event with the OneMap address', async () => {
    mockHandler.findByPk.mockResolvedValue(handlerRow as never);
    mockLookupAddress.mockResolvedValueOnce(ADDRESS);
    mockEvent.findOne.mockResolvedValueOnce(null);
    mockEvent.create.mockResolvedValueOnce({} as never);

    await createEvent(input);

    expect(mockHandler.findByPk).toHaveBeenNthCalledWith(1, HANDLER_UUID, undefined);
    expect(mockHandler.findByPk).toHaveBeenNthCalledWith(2, HANDLER_UUID, {
      lock: fakeT.LOCK.UPDATE,
      transaction: fakeT,
    });
    expect(mockEvent.create).toHaveBeenCalledWith(
      { ...input, address: ADDRESS },
      { transaction: fakeT },
    );
  });
});

describe('listHandlers', () => {
  it('orders handlers by name and returns only uuid and name', async () => {
    mockHandler.findAll.mockResolvedValueOnce([
      { uuid: 'a', name: 'Bob', extra: 'nope' },
      { uuid: 'b', name: 'Amy' },
    ] as never);

    const result = await listHandlers();

    expect(mockHandler.findAll).toHaveBeenCalledWith({ order: [['name', 'ASC']] });
    expect(result).toEqual([
      { uuid: 'a', name: 'Bob' },
      { uuid: 'b', name: 'Amy' },
    ]);
  });
});

describe('listOpenEvents', () => {
  it('returns exactly the five public fields with formatted dates', async () => {
    const row = {
      uuid: 'e1',
      name: 'Career Fair',
      dateTime: new Date('2026-04-20T02:00:00.000Z'),
      address: ADDRESS,
      deadline: new Date('2026-04-19T15:59:59.999Z'),
    };
    mockEvent.findAll.mockResolvedValueOnce([row] as never);

    const result = await listOpenEvents(new Date('2026-04-01T00:00:00.000Z'));

    expect(result).toEqual([
      {
        uuid: 'e1',
        name: 'Career Fair',
        dateTime: '2026-04-20T02:00:00.000Z',
        address: ADDRESS,
        deadline: '2026-04-19',
      },
    ]);
    expect(Object.keys(result[0]).sort()).toEqual(
      ['address', 'dateTime', 'deadline', 'name', 'uuid'].sort(),
    );
  });
});
