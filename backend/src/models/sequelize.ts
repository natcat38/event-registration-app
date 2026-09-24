import { DatabaseError, Sequelize } from 'sequelize';
import { config } from '../config';
import { logger } from '../utils/logger';

// see docs/adr/0003: everything is stored in UTC.
export const sequelize = new Sequelize(config.db.name, config.db.user, config.db.password, {
  host: config.db.host,
  port: config.db.port,
  dialect: 'mysql',
  timezone: '+00:00',
  logging: false,
});

// see docs/adr/0004: one retry when InnoDB picks this transaction as the deadlock victim.
export async function withDeadlockRetry<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (isDeadlock(err)) {
      logger.warn('Deadlock detected, retrying the transaction once');
      return await fn();
    }
    throw err;
  }
}

function isDeadlock(err: unknown): boolean {
  if (!(err instanceof DatabaseError)) return false;
  return (err.original as { code?: string } | undefined)?.code === 'ER_LOCK_DEADLOCK';
}
