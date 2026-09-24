import request from 'supertest';

jest.mock('../services/events');

import { createApp } from '../app';
import { AppError } from '../utils/errors';
import { createEvent, listHandlers } from '../services/events';

const mockCreateEvent = createEvent as jest.MockedFunction<typeof createEvent>;
const mockListHandlers = listHandlers as jest.MockedFunction<typeof listHandlers>;

const app = createApp();

const VALID_UUID = 'd39cf190-3b3b-42e1-ba29-aa1675f25a06';

const VALID_BODY = {
  name: 'Career Fair',
  dateTime: '2026-04-20T10:00:00+08:00',
  postalCode: '018956',
  deadline: '2026-04-19',
  capacity: 100,
  handlerUuid: VALID_UUID,
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('POST /api/admin/events', () => {
  it('returns 200 with an empty body on success', async () => {
    mockCreateEvent.mockResolvedValue(undefined);

    const res = await request(app).post('/api/admin/events').send(VALID_BODY);

    expect(res.status).toBe(200);
    expect(res.text).toBe('');
  });

  it('returns 421 with errors.<field> for each malformed base field', async () => {
    // dateTime/deadline are checked in a .transform that only runs once the
    // base object shape parses, so this covers the other fields on their own.
    const res = await request(app)
      .post('/api/admin/events')
      .send({ ...VALID_BODY, name: '', postalCode: '123', capacity: 0, handlerUuid: 'not-a-uuid' });

    expect(res.status).toBe(421);
    expect(res.body.errors).toHaveProperty('name');
    expect(res.body.errors).toHaveProperty('postalCode');
    expect(res.body.errors).toHaveProperty('capacity');
    expect(res.body.errors).toHaveProperty('handlerUuid');
    expect(mockCreateEvent).not.toHaveBeenCalled();
  });

  it('returns 421 with errors.<field> for an invalid dateTime and deadline', async () => {
    const res = await request(app)
      .post('/api/admin/events')
      .send({ ...VALID_BODY, dateTime: 'not-a-date', deadline: 'nope' });

    expect(res.status).toBe(421);
    expect(res.body.errors).toHaveProperty('dateTime');
    expect(res.body.errors).toHaveProperty('deadline');
    expect(mockCreateEvent).not.toHaveBeenCalled();
  });

  it('returns 400 when the service rejects the postal code', async () => {
    mockCreateEvent.mockRejectedValue(
      new AppError(400, 'Postal code not found.', { postalCode: ['Postal code not found.'] }),
    );

    const res = await request(app).post('/api/admin/events').send(VALID_BODY);

    expect(res.status).toBe(400);
    expect(res.body.errors).toHaveProperty('postalCode');
  });

  it('returns 400 when the handler already has an open event', async () => {
    mockCreateEvent.mockRejectedValue(
      new AppError(400, 'This handler already has an open event.', {
        handlerUuid: ['This handler already has an open event.'],
      }),
    );

    const res = await request(app).post('/api/admin/events').send(VALID_BODY);

    expect(res.status).toBe(400);
    expect(res.body.errors).toHaveProperty('handlerUuid');
  });

  it('returns 400 passthrough when the handler is unknown', async () => {
    mockCreateEvent.mockRejectedValue(
      new AppError(400, 'Handler not found.', { handlerUuid: ['Handler not found.'] }),
    );

    const res = await request(app).post('/api/admin/events').send(VALID_BODY);

    expect(res.status).toBe(400);
    expect(res.body.errors).toHaveProperty('handlerUuid');
  });

  it('returns 500 when the service throws unexpectedly', async () => {
    mockCreateEvent.mockRejectedValue(new Error('OneMap search request failed'));

    const res = await request(app).post('/api/admin/events').send(VALID_BODY);

    expect(res.status).toBe(500);
  });
});

describe('GET /api/admin/handlers', () => {
  it('returns the handler list shape', async () => {
    mockListHandlers.mockResolvedValue([{ uuid: VALID_UUID, name: 'Alice Tan' }]);

    const res = await request(app).get('/api/admin/handlers');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ uuid: VALID_UUID, name: 'Alice Tan' }]);
  });

  it('returns 500 when the service throws unexpectedly', async () => {
    mockListHandlers.mockRejectedValue(new Error('db exploded'));

    const res = await request(app).get('/api/admin/handlers');

    expect(res.status).toBe(500);
  });
});
