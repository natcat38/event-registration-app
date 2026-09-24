import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    res.status(err.status).json({ message: err.message, errors: err.errors });
    return;
  }
  // Body parser, zlib and the Express router all tag request-caused failures with a 4xx status.
  if (clientStatus(err) !== undefined) {
    const e = err as { name?: string; message?: string };
    logger.warn('Malformed request', { name: e.name, message: e.message });
    res.status(421).json({ message: 'Malformed request' });
    return;
  }
  // Log fields only, never the object: Sequelize and axios errors carry SQL params and request bodies.
  const e = err instanceof Error ? err : new Error(String(err));
  logger.error('Unexpected error', { name: e.name, message: e.message, stack: e.stack });
  res.status(500).json({ message: 'Internal server error' });
}

function clientStatus(err: unknown): number | undefined {
  if (typeof err !== 'object' || err === null) return undefined;
  const e = err as { status?: unknown; statusCode?: unknown };
  const status = typeof e.status === 'number' ? e.status : e.statusCode;
  return typeof status === 'number' && status >= 400 && status < 500 ? status : undefined;
}
