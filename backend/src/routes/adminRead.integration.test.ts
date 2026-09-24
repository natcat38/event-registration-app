// Needs a running, migrated and seeded MySQL. Rows created here are prefixed it-read- and removed in afterAll.
import { randomUUID } from 'crypto';
import request from 'supertest';
import { createApp } from '../app';
import { Event, Registration, sequelize } from '../models';

const app = createApp();
const HANDLER_ALICE = 'd39cf190-3b3b-42e1-ba29-aa1675f25a06';
const RUN = `it-read-${randomUUID().slice(0, 8)}`;
const FAR = new Date('2099-01-01T00:00:00.000Z');
const PAST = new Date('2020-01-01T00:00:00.000Z');
const created: string[] = [];

async function makeEvent(name: string, deadline = FAR, capacity = 10) {
  const event = await Event.create({
    uuid: randomUUID(),
    name,
    dateTime: FAR,
    postalCode: '018956',
    address: `${RUN} address`,
    deadline,
    capacity,
    handlerUuid: HANDLER_ALICE,
  });
  created.push(event.uuid);
  return event;
}

async function setCreatedAt(table: 'events' | 'registrations', uuid: string, at: string) {
  await sequelize.query(`UPDATE ${table} SET createdAt = :at WHERE uuid = :uuid`, {
    replacements: { at, uuid },
  });
}

beforeAll(async () => sequelize.authenticate());
afterAll(async () => {
  await Registration.destroy({ where: { eventUuid: created } });
  await Event.destroy({ where: { uuid: created } });
  await sequelize.close();
});

describe('GET /api/admin/events', () => {
  it('matches LIKE wildcards literally and searches the handler name', async () => {
    await makeEvent(`${RUN} 100% sure`);
    await makeEvent(`${RUN} under_score`);
    await makeEvent(`${RUN} back\\slash`);
    for (const [term, expected] of [
      ['100%', '100% sure'],
      ['under_', 'under_score'],
      ['back\\', 'back\\slash'],
    ]) {
      const res = await request(app)
        .get('/api/admin/events')
        .query({ search: `${RUN} ${term}` });
      expect(res.status).toBe(200);
      expect(res.body.total).toBe(1);
      expect(res.body.events[0].name).toContain(expected);
    }
    const byHandler = await request(app).get('/api/admin/events').query({ search: 'Alice Tan' });
    expect(byHandler.body.total).toBeGreaterThanOrEqual(3);
    expect(byHandler.body.events[0].handler).toEqual({ uuid: HANDLER_ALICE, name: 'Alice Tan' });
  });

  it('pages ten at a time, reports the total, and returns an empty page past the end', async () => {
    const prefix = `${RUN} page`;
    for (let i = 0; i < 11; i++) await makeEvent(`${prefix} ${String(i).padStart(2, '0')}`);
    const p1 = await request(app).get('/api/admin/events').query({ search: prefix, page: 1 });
    const p2 = await request(app).get('/api/admin/events').query({ search: prefix, page: 2 });
    const p3 = await request(app).get('/api/admin/events').query({ search: prefix, page: 3 });
    expect(p1.body.total).toBe(11);
    expect(p1.body.events).toHaveLength(10);
    expect(p2.body.events).toHaveLength(1);
    expect(p3.body).toEqual({ total: 11, events: [] });
    expect(Object.keys(p1.body.events[0]).sort()).toEqual([
      'address',
      'capacity',
      'createdAt',
      'dateTime',
      'deadline',
      'handler',
      'name',
      'registrationCount',
      'uuid',
    ]);
  });

  it('filters to open events only when open=true, and not for open=false', async () => {
    const prefix = `${RUN} open`;
    await makeEvent(`${prefix} live`);
    await makeEvent(`${prefix} past`, PAST);
    const full = await makeEvent(`${prefix} full`, FAR, 1);
    await full.update({ registrationCount: 1 });
    const open = await request(app)
      .get('/api/admin/events')
      .query({ search: prefix, open: 'true' });
    const all = await request(app)
      .get('/api/admin/events')
      .query({ search: prefix, open: 'false' });
    expect(open.body.events.map((e: { name: string }) => e.name)).toEqual([`${prefix} live`]);
    expect(all.body.total).toBe(3);
  });
});

describe('POST /api/admin/events/:uuid/trend', () => {
  it('walks creation date to deadline in Singapore dates and counts a 16:30Z registration on the next day', async () => {
    const event = await makeEvent(`${RUN} trend`, new Date('2026-04-20T15:59:59.999Z'));
    await setCreatedAt('events', event.uuid, '2026-04-15 00:00:00');
    const reg = await Registration.create({
      eventUuid: event.uuid,
      emailAddress: `${RUN}@example.com`,
      registrationNo: 1,
    });
    await setCreatedAt('registrations', reg.uuid, '2026-04-17 16:30:00');
    const res = await request(app).post(`/api/admin/events/${event.uuid}/trend`);
    expect(res.status).toBe(200);
    expect(res.body.map((r: { date: string }) => r.date)).toEqual([
      '2026-04-15',
      '2026-04-16',
      '2026-04-17',
      '2026-04-18',
      '2026-04-19',
      '2026-04-20',
    ]);
    expect(res.body.map((r: { newRegistrationCount: number }) => r.newRegistrationCount)).toEqual([
      0, 0, 0, 1, 0, 0,
    ]);
    expect(res.body[5].registrationCount).toBe(1);
  });

  it('returns one creation-date row for a deadline before creation, and 400 for an unknown event', async () => {
    const event = await makeEvent(`${RUN} closed`, PAST);
    const res = await request(app).post(`/api/admin/events/${event.uuid}/trend`);
    expect(res.body).toHaveLength(1);
    expect((await request(app).post(`/api/admin/events/${randomUUID()}/trend`)).status).toBe(400);
  });
});
