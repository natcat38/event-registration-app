import type { NextFunction, Request, Response } from 'express';
import { logger } from '../utils/logger';

// One line per request. Query strings and bodies are never logged (they can hold email addresses).
export function requestLog(req: Request, res: Response, next: NextFunction) {
  const started = Date.now();
  res.on('finish', () => {
    logger.info('request', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      ms: Date.now() - started,
    });
  });
  next();
}
