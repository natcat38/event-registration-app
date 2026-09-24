import winston from 'winston';
import { config } from '../config';

export const logger = winston.createLogger({
  level: 'info',
  silent: config.isTest,
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console()],
});
