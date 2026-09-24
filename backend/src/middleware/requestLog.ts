import type { NextFunction, Request, Response } from 'express';
import { logger } from '../utils/logger';

// One line per request. Query strings and bodies are never logged (they can hold email addresses).
export function requestLog(req: Request, res: Response, next: NextFunction) {
  const started = Date.now();
  res.on('finish', () => {
    logger.info('request', {
      method: req.method,
      // originalUrl, not req.path: a mounted router strips its prefix from req.path before finish fires.
      path: req.originalUrl.split('?')[0],
      status: res.statusCode,
      ms: Date.now() - started,
    });
  });
  next();
}
