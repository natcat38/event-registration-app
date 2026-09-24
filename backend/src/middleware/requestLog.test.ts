import express, { Router } from 'express';
import request from 'supertest';
import { logger } from '../utils/logger';
import { requestLog } from './requestLog';

describe('requestLog', () => {
  it('logs the full path, without the query, for a request a mounted router answered', async () => {
    const info = jest.spyOn(logger, 'info').mockImplementation(() => logger);
    const router = Router();
    router.get('/events', (_req, res) => {
      res.status(200).json([]);
    });
    const app = express();
    app.use(requestLog);
    app.use('/api/public', router);

    await request(app).get('/api/public/events?search=a%40b.com').expect(200);

    expect(info).toHaveBeenCalledWith(
      'request',
      expect.objectContaining({ method: 'GET', path: '/api/public/events', status: 200 }),
    );
    info.mockRestore();
  });
});
