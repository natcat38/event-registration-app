import request from 'supertest';

jest.mock('../services/adminEvents');
jest.mock('../services/trend');

import { createApp } from '../app';
import { listAdminEvents } from '../services/adminEvents';
import { getEventTrend } from '../services/trend';
import { AppError } from '../utils/errors';

const mockList = listAdminEvents as jest.MockedFunction<typeof listAdminEvents>;
const mockTrend = getEventTrend as jest.MockedFunction<typeof getEventTrend>;
const app = createApp();
const UUID = 'd39cf190-3b3b-42e1-ba29-aa1675f25a06';

beforeEach(() => jest.clearAllMocks());

describe('GET /api/admin/events', () => {
  it('passes a parsed query to the service and returns its result', async () => {
    mockList.mockResolvedValue({ total: 0, events: [] });
    const res = await request(app).get('/api/admin/events?page=2&search=%20tech%20&open=TRUE');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ total: 0, events: [] });
    expect(mockList).toHaveBeenCalledWith({ page: 2, search: 'tech', open: true });
  });

  it('defaults page to 1 and ignores open=false', async () => {
    mockList.mockResolvedValue({ total: 0, events: [] });
    await request(app).get('/api/admin/events?open=false');
    expect(mockList).toHaveBeenCalledWith({ page: 1, search: undefined, open: undefined });
  });

  it('returns 421 for a bad page', async () => {
    const res = await request(app).get('/api/admin/events?page=0');
    expect(res.status).toBe(421);
    expect(res.body.errors).toHaveProperty('page');
    expect(mockList).not.toHaveBeenCalled();
  });
});

describe('POST /api/admin/events/:uuid/trend', () => {
  it('returns the trend rows', async () => {
    mockTrend.mockResolvedValue([
      { date: '2026-04-20', registrationCount: 1, newRegistrationCount: 1 },
    ]);
    const res = await request(app).post(`/api/admin/events/${UUID}/trend`);
    expect(res.status).toBe(200);
    expect(res.body[0].date).toBe('2026-04-20');
    expect(mockTrend).toHaveBeenCalledWith(UUID);
  });

  it('lower-cases the uuid before the lookup', async () => {
    mockTrend.mockResolvedValue([]);
    await request(app).post(`/api/admin/events/${UUID.toUpperCase()}/trend`);
    expect(mockTrend).toHaveBeenCalledWith(UUID);
  });

  it('returns 421 for a malformed uuid and for a bad percent-encoding', async () => {
    expect((await request(app).post('/api/admin/events/not-a-uuid/trend')).status).toBe(421);
    expect((await request(app).post('/api/admin/events/abc%zz/trend')).status).toBe(421);
    expect(mockTrend).not.toHaveBeenCalled();
  });

  it('returns 400 for an unknown event', async () => {
    mockTrend.mockRejectedValue(new AppError(400, 'Event not found.'));
    const res = await request(app).post(`/api/admin/events/${UUID}/trend`);
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Event not found.');
  });
});
