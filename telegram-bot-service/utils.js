require('dotenv').config({ path: './.env' });

// Константы для telegram-bot-service
const DATABASE_SERVICE_API_KEY = process.env.DATABASE_SERVICE_API_KEY || 'database-service-secure-api-key-2024';
const DATABASE_SERVICE_URL = process.env.DATABASE_SERVICE_URL || 'http://localhost:3012';

// Константы для balance-service (как в мультичате)
const BALANCE_SERVICE_API_KEY = process.env.BALANCE_SERVICE_API_KEY || 'balance-service-secure-api-key-2024';
const BALANCE_SERVICE_URL = process.env.BALANCE_SERVICE_URL || 'http://localhost:3002';

module.exports = {
  DATABASE_SERVICE_URL,
  DATABASE_SERVICE_API_KEY,
  BALANCE_SERVICE_URL,
  BALANCE_SERVICE_API_KEY
};
