// Race and capacity cases for event creation, split from admin.integration.test.ts to keep both files short.
// Same setup: real MySQL, OneMap mocked, three seeded handlers, it-admin-... rows removed in afterAll.
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

describe('POST /api/admin/events capacity', () => {
  it('a second create succeeds when the existing event is full despite an open deadline', async () => {
    const fullName = eventName('full');
    const afterFullName = eventName('after-full');
    createdNames.push(fullName, afterFullName);

    const fullEvent = await Event.create({
      uuid: randomUUID(),
      name: fullName,
      dateTime: new Date('2099-12-31T10:00:00.000Z'),
      postalCode: '018956',
      address: MOCKED_ADDRESS,
      deadline: new Date('2099-01-01T00:00:00.000Z'),
      capacity: 1,
      registrationCount: 0,
      handlerUuid: HANDLER_CHEN,
    });
    await Registration.create({
      uuid: randomUUID(),
      eventUuid: fullEvent.uuid,
      emailAddress: 'full-handler-test@example.com',
      registrationNo: 1,
    });
    await fullEvent.update({ registrationCount: 1 });

    const res = await request(app)
      .post('/api/admin/events')
      .send(validBody({ name: afterFullName, handlerUuid: HANDLER_CHEN }));

    expect(res.status).toBe(200);
  });
});

describe('POST /api/admin/events name race', () => {
  it('two concurrent creates with the same name on different handlers give one 200 and one 400', async () => {
    const name = eventName('name-race');
    createdNames.push(name);
    const [resA, resB] = await Promise.all([
      request(app)
        .post('/api/admin/events')
        .send(validBody({ name, handlerUuid: HANDLER_DIVYA })),
      request(app)
        .post('/api/admin/events')
        .send(validBody({ name, handlerUuid: HANDLER_ERIN })),
    ]);
    expect([resA.status, resB.status].sort()).toEqual([200, 400]);
    const loser = resA.status === 400 ? resA : resB;
    expect(loser.body.errors).toHaveProperty('name');
  }, 30_000);
});
