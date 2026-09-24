import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import { config } from './config';
import { errorHandler } from './middleware/errorHandler';
import { requestLog } from './middleware/requestLog';
import { sequelize } from './models';
import { logger } from './utils/logger';
import adminRouter from './routes/admin';
import publicRouter from './routes/public';

export function createApp(): Express {
  const app = express();

  // see docs/adr/0009
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(cors({ origin: config.corsOrigin }));
  app.use(requestLog); // before the body parser so a malformed body is still logged
  app.use(express.json({ limit: '100kb' }));

  app.use('/api/public', publicRouter);

  // see docs/adr/0010: an operations endpoint, outside the product contract.
  app.get('/health', async (_req, res) => {
    try {
      await sequelize.query('SELECT 1');
      res.status(200).json({ status: 'ok' });
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err));
      logger.error('Health check failed', { name: e.name, message: e.message });
      res.status(503).json({ status: 'db_unreachable' });
    }
  });

  app.use('/api/admin', adminRouter);

  app.use((_req, res) => {
    res.status(404).json({ message: 'Not found' });
  });
  app.use(errorHandler);
  return app;
}
