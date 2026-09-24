jest.mock('../models', () => ({
  Event: { findAndCountAll: jest.fn() },
  Handler: {},
}));

import { Op } from 'sequelize';
import { Event } from '../models';
import { listAdminEvents } from './adminEvents';
import type { AdminEventsQuery } from '../validation/schemas';

const mockEvent = Event as jest.Mocked<typeof Event>;
const NOW = new Date('2026-04-01T00:00:00.000Z');

function baseQuery(overrides: Partial<AdminEventsQuery> = {}): AdminEventsQuery {
  return { page: 1, open: undefined, search: undefined, ...overrides };
}

const row = {
  uuid: 'e1',
  name: 'Career Fair',
  dateTime: new Date('2026-04-20T02:00:00.000Z'),
  address: '10 BAYFRONT AVENUE SINGAPORE 018956',
  deadline: new Date('2026-04-19T15:59:59.999Z'),
  createdAt: new Date('2026-03-01T00:00:00.000Z'),
  capacity: 100,
  registrationCount: 3,
  Handler: { uuid: 'h1', name: 'Alice Tan' },
};

beforeEach(() => {
  jest.clearAllMocks();
  mockEvent.findAndCountAll.mockResolvedValue({ rows: [row] as never, count: 1 } as never);
});

describe('listAdminEvents', () => {
  it('turns page 3 into offset 20 with the fixed page size', async () => {
    await listAdminEvents(baseQuery({ page: 3 }), NOW);

    expect(mockEvent.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 10, offset: 20 }),
    );
  });

  it('adds no where clause when neither open nor search is set', async () => {
    await listAdminEvents(baseQuery(), NOW);

    expect(mockEvent.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({ where: undefined }),
    );
  });

  it('adds the open condition when requested', async () => {
    await listAdminEvents(baseQuery({ open: true }), NOW);

    const call = mockEvent.findAndCountAll.mock.calls[0][0] as { where: { [Op.and]: unknown[] } };
    expect(call.where[Op.and]).toHaveLength(1);
  });

  it('escapes %, _ and \\ in the search term and wraps it in wildcards', async () => {
    await listAdminEvents(baseQuery({ search: '50%_off\\deal' }), NOW);

    const call = mockEvent.findAndCountAll.mock.calls[0][0] as {
      where: { [Op.and]: [{ [Op.or]: [{ name: { [Op.like]: string } }] }] };
    };
    const [searchCondition] = call.where[Op.and];
    expect(searchCondition[Op.or][0].name[Op.like]).toBe('%50\\%\\_off\\\\deal%');
  });

  it('includes the Handler model as required', async () => {
    await listAdminEvents(baseQuery(), NOW);

    const call = mockEvent.findAndCountAll.mock.calls[0][0] as {
      include: [{ required: boolean }];
    };
    expect(call.include[0].required).toBe(true);
  });

  it('maps rows to a dto with the five public fields plus admin fields and passes total through', async () => {
    const result = await listAdminEvents(baseQuery(), NOW);

    expect(result.total).toBe(1);
    expect(result.events).toEqual([
      {
        uuid: 'e1',
        name: 'Career Fair',
        dateTime: '2026-04-20T02:00:00.000Z',
        address: '10 BAYFRONT AVENUE SINGAPORE 018956',
        deadline: '2026-04-19',
        createdAt: '2026-03-01T00:00:00.000Z',
        capacity: 100,
        registrationCount: 3,
        handler: { uuid: 'h1', name: 'Alice Tan' },
      },
    ]);
  });
});
