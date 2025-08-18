require('dotenv').config({ path: './.env' });

// Константы для balance-service
const DATABASE_SERVICE_API_KEY = process.env.DATABASE_SERVICE_API_KEY || 'database-service-secure-api-key-2024';
const DATABASE_SERVICE_URL = process.env.DATABASE_SERVICE_URL || 'http://localhost:3012';

module.exports = {
  DATABASE_SERVICE_URL,
  DATABASE_SERVICE_API_KEY
};
