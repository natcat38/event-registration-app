const path = require('path');

// sequelize-cli cannot load src/config.ts; this mirrors its db block. Keep the two in sync.
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const shared = {
  username: process.env.DB_USER ?? 'app_user',
  password: process.env.DB_PASSWORD ?? 'app_password',
  database: process.env.DB_NAME ?? 'event_registration',
  host: process.env.DB_HOST ?? '127.0.0.1',
  port: Number(process.env.DB_PORT ?? 3306),
  dialect: 'mysql',
  timezone: '+00:00',
};

module.exports = { development: shared, test: shared, production: shared };
