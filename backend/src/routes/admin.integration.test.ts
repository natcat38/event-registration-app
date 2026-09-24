// Needs a running, migrated and seeded MySQL. OneMap is mocked at the module boundary.
// Only the three handlers below are touched; every event created here is named it-admin-... and removed in afterAll.
import { randomUUID } from 'crypto';
import request from 'supertest';

jest.mock('../services/onemap');

import { createApp } from '../app';
import { Event, Registration, sequelize } from '../models';
import { lookupAddress } from '../services/onemap';

const mockLookupAddress = lookupAddress as jest.MockedFunction<typeof lookupAddress>;

const app = createApp();

const HANDLER_CHEN = 'c0e08739-c750-4984-90a7-6837d371c838';
const HANDLER_DIVYA = '8f8de11b-16d0-4fb3-b9dc-085eae531d6e';
const HANDLER_ERIN = '4aa935bb-8405-4c1c-80e7-109a07b74efb';
const MOCKED_ADDRESS = '10 BAYFRONT AVENUE SINGAPORE 018956';

function eventName(label: string): string {
  return `it-admin-${label}-${randomUUID()}`;
}

function validBody(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    name: eventName('event'),
    dateTime: '2099-12-31T10:00:00+08:00',
    postalCode: '018956',
    deadline: '2099-01-01',
    capacity: 100,
    handlerUuid: HANDLER_CHEN,
    ...overrides,
  };
}

/** Marks every event for a handler as closed, freeing it for the next test in this file. */
async function freeHandler(handlerUuid: string): Promise<void> {
  await Event.update(
    { deadline: new Date('2020-01-01T00:00:00.000Z') },
    { where: { handlerUuid } },
  );
}

const createdNames: string[] = [];

beforeAll(async () => {
  await sequelize.authenticate();
});

afterAll(async () => {
  if (createdNames.length > 0) {
    const events = await Event.findAll({ where: { name: createdNames } });
    await Registration.destroy({ where: { eventUuid: events.map((e) => e.uuid) } });
    await Event.destroy({ where: { name: createdNames } });
  }
  await sequelize.close();
});

beforeEach(() => {
  jest.clearAllMocks();
  mockLookupAddress.mockResolvedValue(MOCKED_ADDRESS);
});

// Unconditional: whichever handler a test touched, the next test starts with all three free.
afterEach(async () => {
  await freeHandler(HANDLER_CHEN);
  await freeHandler(HANDLER_DIVYA);
  await freeHandler(HANDLER_ERIN);
});

describe('POST /api/admin/events', () => {
  it('two concurrent creates for one handler give exactly one 200 and one 400', async () => {
    const nameA = eventName('concurrent-a');
    const nameB = eventName('concurrent-b');
    createdNames.push(nameA, nameB);

    const [resA, resB] = await Promise.all([
      request(app)
        .post('/api/admin/events')
        .send(validBody({ name: nameA, handlerUuid: HANDLER_DIVYA })),
      request(app)
        .post('/api/admin/events')
        .send(validBody({ name: nameB, handlerUuid: HANDLER_DIVYA })),
    ]);

    const statuses = [resA.status, resB.status].sort();
    expect(statuses).toEqual([200, 400]);
    const loser = resA.status === 400 ? resA : resB;
    expect(loser.body.errors).toHaveProperty('handlerUuid');
  }, 30_000);

  it('a second create succeeds once the handler is free again by a past deadline', async () => {
    const closedName = eventName('closed');
    const afterClosedName = eventName('after-closed');
    createdNames.push(closedName, afterClosedName);

    await Event.create({
      uuid: randomUUID(),
      name: closedName,
      dateTime: new Date('2020-01-05T10:00:00.000Z'),
      postalCode: '018956',
      address: MOCKED_ADDRESS,
      deadline: new Date('2020-01-01T00:00:00.000Z'),
      capacity: 5,
      registrationCount: 0,
      handlerUuid: HANDLER_ERIN,
    });

    const res = await request(app)
      .post('/api/admin/events')
      .send(validBody({ name: afterClosedName, handlerUuid: HANDLER_ERIN }));

    expect(res.status).toBe(200);
  });

  it('rejects a duplicate event name with 400 on the name field', async () => {
    const name = eventName('duplicate');
    createdNames.push(name);

    const first = await request(app)
      .post('/api/admin/events')
      .send(validBody({ name, handlerUuid: HANDLER_CHEN }));
    expect(first.status).toBe(200);

    await freeHandler(HANDLER_CHEN);

    const second = await request(app)
      .post('/api/admin/events')
      .send(validBody({ name, handlerUuid: HANDLER_CHEN }));
    expect(second.status).toBe(400);
    expect(second.body.errors).toHaveProperty('name');
  });

  it('returns 400 for an unknown handler', async () => {
    const res = await request(app)
      .post('/api/admin/events')
      .send(validBody({ name: eventName('unknown-handler'), handlerUuid: randomUUID() }));

    expect(res.status).toBe(400);
    expect(res.body.errors).toHaveProperty('handlerUuid');
  });

  it('returns 400 with errors.postalCode when OneMap finds no match', async () => {
    mockLookupAddress.mockResolvedValueOnce(null);

    const res = await request(app)
      .post('/api/admin/events')
      .send(validBody({ name: eventName('postal-miss'), handlerUuid: HANDLER_CHEN }));

    expect(res.status).toBe(400);
    expect(res.body.errors).toHaveProperty('postalCode');
  });

  it('keeps only the Singapore date of a full-timestamp deadline', async () => {
    const name = eventName('full-timestamp-deadline');
    createdNames.push(name);
    const res = await request(app)
      .post('/api/admin/events')
      .send(validBody({ name, deadline: '2099-01-01T10:00:00+08:00' }));

    expect(res.status).toBe(200);
    const stored = await Event.findOne({ where: { name } });
    expect(stored?.deadline.toISOString()).toBe('2099-01-01T15:59:59.999Z');
  });

  it('stores the mocked address and returns an empty 200 body on success', async () => {
    const name = eventName('success');
    createdNames.push(name);

    const res = await request(app)
      .post('/api/admin/events')
      .send(validBody({ name, handlerUuid: HANDLER_CHEN }));

    expect(res.status).toBe(200);
    expect(res.text).toBe('');

    const stored = await Event.findOne({ where: { name } });
    expect(stored?.address).toBe(MOCKED_ADDRESS);
  });
});

describe('GET /api/admin/handlers', () => {
  it('includes the seeded handlers', async () => {
    const res = await request(app).get('/api/admin/handlers');

    expect(res.status).toBe(200);
    expect(res.body.map((h: { uuid: string }) => h.uuid)).toContain(HANDLER_CHEN);
  });
});
