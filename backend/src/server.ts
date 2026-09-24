import { createApp } from './app';
import { config } from './config';
import { sequelize } from './models';
import { logger } from './utils/logger';

async function main() {
  // see docs/adr/0005: creates cannot work without OneMap credentials, so refuse to start.
  if (!config.oneMap.email || !config.oneMap.password) {
    logger.error('ONEMAP_EMAIL and ONEMAP_PASSWORD must be set in .env (see README, step 1)');
    process.exit(1);
  }
  try {
    await sequelize.authenticate();
  } catch (err) {
    const e = err instanceof Error ? err : new Error(String(err));
    logger.error('Database unreachable at startup', { name: e.name, message: e.message });
    process.exit(1);
  }

  const server = createApp().listen(config.port, () => {
    logger.info(`API listening on port ${config.port}`);
  });
  server.on('error', (err: NodeJS.ErrnoException) => {
    const hint = err.code === 'EADDRINUSE' ? `port ${config.port} is already in use` : err.message;
    logger.error(`Server failed to start: ${hint}`);
    process.exit(1);
  });
}

main();
