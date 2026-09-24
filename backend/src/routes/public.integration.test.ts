// needs a running, migrated, seeded MySQL (docker compose up -d --wait).
import { randomUUID } from 'crypto';
import request from 'supertest';
import { createApp } from '../app';
import { Event, Registration, sequelize } from '../models';

const app = createApp();

// Only these two seeded handlers are used here so fixtures never collide with admin.integration.test.ts.
const HANDLER_ALICE = 'd39cf190-3b3b-42e1-ba29-aa1675f25a06';
const HANDLER_BALA = 'c7260cb9-2e26-49f7-8c54-e62f889930d8';

function eventName(): string {
  return `it-public-${randomUUID()}`;
}

async function createEvent(
  overrides: Partial<{ deadline: Date; capacity: number; handlerUuid: string }> = {},
): Promise<string> {
  const event = await Event.create({
    name: eventName(),
    dateTime: new Date('2026-04-20T10:00:00.000Z'),
    postalCode: '123456',
    address: '1 Test Street, Singapore',
    deadline: overrides.deadline ?? new Date('2099-01-01T00:00:00.000Z'),
    capacity: overrides.capacity ?? 5,
    handlerUuid: overrides.handlerUuid ?? HANDLER_ALICE,
  });
  return event.uuid;
}

async function cleanupEvent(eventUuid: string): Promise<void> {
  await Registration.destroy({ where: { eventUuid } });
  await Event.destroy({ where: { uuid: eventUuid } });
}

beforeAll(async () => {
  await sequelize.authenticate();
});

afterAll(async () => {
  await sequelize.close();
});

describe('POST /api/public/register, concurrency race', () => {
  it('exactly 5 of 20 concurrent registrations succeed, numbered 00001-00005', async () => {
    const eventUuid = await createEvent({ capacity: 5, handlerUuid: HANDLER_BALA });

    try {
      const emails = Array.from({ length: 20 }, (_, i) => `racer-${i}-${randomUUID()}@example.com`);
      const responses = await Promise.all(
        emails.map((emailAddress) =>
          request(app).post('/api/public/register').send({ eventUuid, emailAddress }),
        ),
      );

      const succeeded = responses.filter((r) => r.status === 200);
      const failed = responses.filter((r) => r.status === 400);
      expect(succeeded).toHaveLength(5);
      expect(failed).toHaveLength(15);

      const numbers = new Set(succeeded.map((r) => r.body.registrationNo));
      expect(numbers).toEqual(new Set(['00001', '00002', '00003', '00004', '00005']));

      const event = await Event.findOne({ where: { uuid: eventUuid } });
      const count = await Registration.count({ where: { eventUuid } });
      expect(event?.registrationCount).toBe(count);
    } finally {
      await cleanupEvent(eventUuid);
    }
  }, 30_000);
});

describe('POST /api/public/register, error paths', () => {
  it('returns 400 with an emailAddress field error for a duplicate email', async () => {
    const eventUuid = await createEvent();
    const emailAddress = `dup-${randomUUID()}@example.com`;
    const expectedMessage = 'This email address is already registered for this event.';

    try {
      const first = await request(app)
        .post('/api/public/register')
        .send({ eventUuid, emailAddress });
      expect(first.status).toBe(200);

      const second = await request(app)
        .post('/api/public/register')
        .send({ eventUuid, emailAddress });
      expect(second.status).toBe(400);
      expect(second.body.message).toBe(expectedMessage);
      expect(second.body.errors).toEqual({ emailAddress: [expectedMessage] });
    } finally {
      await cleanupEvent(eventUuid);
    }
  });

  it('returns 400 for a closed (deadline passed) event', async () => {
    const eventUuid = await createEvent({ deadline: new Date('2020-01-01T00:00:00.000Z') });

    try {
      const res = await request(app)
        .post('/api/public/register')
        .send({ eventUuid, emailAddress: `closed-${randomUUID()}@example.com` });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('This event is closed for registration.');
    } finally {
      await cleanupEvent(eventUuid);
    }
  });

  it('returns 400 for an unknown well-formed eventUuid', async () => {
    const res = await request(app)
      .post('/api/public/register')
      .send({ eventUuid: randomUUID(), emailAddress: `unknown-${randomUUID()}@example.com` });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Event not found.');
  });

  it('returns 421 for a malformed uuid', async () => {
    const res = await request(app)
      .post('/api/public/register')
      .send({ eventUuid: 'not-a-uuid', emailAddress: `bad-${randomUUID()}@example.com` });

    expect(res.status).toBe(421);
    expect(res.body.errors).toHaveProperty('eventUuid');
  });

  it('returns 421 for a malformed JSON body', async () => {
    const res = await request(app)
      .post('/api/public/register')
      .set('Content-Type', 'application/json')
      .send('{not json');

    expect(res.status).toBe(421);
  });
});

describe('GET /api/public/events', () => {
  it('lists only open events with exactly the 5 public fields', async () => {
    const openUuid = await createEvent();
    const closedUuid = await createEvent({ deadline: new Date('2020-01-01T00:00:00.000Z') });

    try {
      const res = await request(app).get('/api/public/events');
      expect(res.status).toBe(200);

      const found = res.body.find((e: { uuid: string }) => e.uuid === openUuid);
      expect(found).toBeDefined();
      expect(Object.keys(found).sort()).toEqual(
        ['address', 'dateTime', 'deadline', 'name', 'uuid'].sort(),
      );

      const missing = res.body.find((e: { uuid: string }) => e.uuid === closedUuid);
      expect(missing).toBeUndefined();
    } finally {
      await cleanupEvent(openUuid);
      await cleanupEvent(closedUuid);
    }
  });
});
