import dotenv from 'dotenv';
import path from 'path';

// backend commands run with cwd=backend/; the single .env lives at the repo root.
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

function parsePort(name: string, raw: string | undefined, fallback: number): number {
  if (raw === undefined) return fallback;
  const port = Number(raw);
  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error(`Invalid ${name}: "${raw}" is not a valid port number`);
  }
  return port;
}

export const config = {
  isTest: process.env.NODE_ENV === 'test',
  port: parsePort('PORT', process.env.PORT, 8000),
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:8001',
  rateLimitEnabled: process.env.RATE_LIMIT_ENABLED === 'true',
  db: {
    host: process.env.DB_HOST ?? '127.0.0.1',
    port: parsePort('DB_PORT', process.env.DB_PORT, 3306),
    name: process.env.DB_NAME ?? 'event_registration',
    user: process.env.DB_USER ?? 'app_user',
    password: process.env.DB_PASSWORD ?? 'app_password',
  },
  oneMap: {
    email: process.env.ONEMAP_EMAIL ?? '',
    password: process.env.ONEMAP_PASSWORD ?? '',
  },
};
