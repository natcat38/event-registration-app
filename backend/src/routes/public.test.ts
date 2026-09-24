import request from 'supertest';

jest.mock('../services/events');
jest.mock('../services/registrations');

import { createApp } from '../app';
import { AppError } from '../utils/errors';
import { listOpenEvents } from '../services/events';
import { register } from '../services/registrations';

const mockListOpenEvents = listOpenEvents as jest.MockedFunction<typeof listOpenEvents>;
const mockRegister = register as jest.MockedFunction<typeof register>;

const VALID_UUID = 'd39cf190-3b3b-42e1-ba29-aa1675f25a06';

beforeEach(() => {
  jest.clearAllMocks();
});

const app = createApp();

describe('GET /api/public/events', () => {
  it('returns 200 with exactly the 5 public fields', async () => {
    mockListOpenEvents.mockResolvedValue([
      {
        uuid: VALID_UUID,
        name: 'Career Fair',
        dateTime: '2026-04-20T10:00:00.000Z',
        address: 'Somewhere',
        deadline: '2026-04-19',
      },
    ]);

    const res = await request(app).get('/api/public/events');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(Object.keys(res.body[0]).sort()).toEqual(
      ['address', 'dateTime', 'deadline', 'name', 'uuid'].sort(),
    );
  });

  it('returns 500 when the service throws unexpectedly', async () => {
    mockListOpenEvents.mockRejectedValue(new Error('db exploded'));

    const res = await request(app).get('/api/public/events');

    expect(res.status).toBe(500);
  });
});

describe('POST /api/public/register', () => {
  it('returns 200 with the registration number on success', async () => {
    mockRegister.mockResolvedValue('00001');

    const res = await request(app)
      .post('/api/public/register')
      .send({ eventUuid: VALID_UUID, emailAddress: 'a@b.com' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ registrationNo: '00001' });
    expect(mockRegister).toHaveBeenCalledWith(VALID_UUID, 'a@b.com');
  });

  it('returns 421 on a malformed body', async () => {
    const res = await request(app)
      .post('/api/public/register')
      .send({ eventUuid: VALID_UUID, emailAddress: 'not-an-email' });

    expect(res.status).toBe(421);
    expect(res.body.errors).toHaveProperty('emailAddress');
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('returns 421 on a bad-variant uuid', async () => {
    const res = await request(app)
      .post('/api/public/register')
      .send({ eventUuid: '11111111-1111-1111-1111-111111111111', emailAddress: 'a@b.com' });

    expect(res.status).toBe(421);
    expect(res.body.errors).toHaveProperty('eventUuid');
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('passes an AppError from the service straight through', async () => {
    mockRegister.mockRejectedValue(new AppError(400, 'Event not found.'));

    const res = await request(app)
      .post('/api/public/register')
      .send({ eventUuid: VALID_UUID, emailAddress: 'a@b.com' });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Event not found.');
  });

  it('returns 500 when the service throws an unmapped error', async () => {
    mockRegister.mockRejectedValue(new Error('unexpected'));

    const res = await request(app)
      .post('/api/public/register')
      .send({ eventUuid: VALID_UUID, emailAddress: 'a@b.com' });

    expect(res.status).toBe(500);
  });
});

describe('POST /api/public/register with the rate limit on', () => {
  it('is mounted with the standard { message } 429 body when config.rateLimitEnabled is true', async () => {
    let app: import('express').Express;

    jest.isolateModules(() => {
      jest.doMock('../services/events');
      jest.doMock('../services/registrations');
      jest.doMock('../config', () => {
        const actual = jest.requireActual<{ config: object }>('../config');
        return { config: { ...actual.config, rateLimitEnabled: true } };
      });
      // A stub limiter that always trips, so this test proves the wiring
      // (mounted only when the flag is on, JSON body shape) without needing
      // 10000 real requests.
      jest.doMock('express-rate-limit', () =>
        jest.fn(
          (opts: {
            handler: (
              req: unknown,
              res: { status: (n: number) => { json: (b: unknown) => void } },
            ) => void;
          }) =>
            (req: unknown, res: { status: (n: number) => { json: (b: unknown) => void } }) => {
              opts.handler(req, res);
            },
        ),
      );

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      app = require('../app').createApp();
    });

    const res = await request(app)
      .post('/api/public/register')
      .send({ eventUuid: VALID_UUID, emailAddress: 'a@b.com' });

    expect(res.status).toBe(429);
    expect(res.body).toEqual({ message: 'Too many requests, try again shortly.' });
  });
});
