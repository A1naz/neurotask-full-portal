const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const envPath = path.join(__dirname, '.env');

require('dotenv').config({ path: path.join(__dirname, '.env') });

const telegramBotsRoutes = require('./routes/telegram-bots');
const aiSettingsRoutes = require('./routes/ai-settings');
const projectSettingsRoutes = require('./routes/project-settings');
const selectedProvidersRoutes = require('./routes/selected-providers');
const providerOrderRoutes = require('./routes/provider-order');

const app = express();
const PORT = process.env.DATABASE_SERVICE_PORT || 3012;

// Подключение к MongoDB с оптимизированными настройками для масштабирования
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://neurotask:2SF7ZA0HU17Dq)223@87.239.104.89/neurotask';

// Fallback значения для всех переменных окружения
const DATABASE_SERVICE_API_KEY = process.env.DATABASE_SERVICE_API_KEY || 'database-service-secure-api-key-2024';
const CACHE_SERVICE_URL = process.env.CACHE_SERVICE_URL || 'http://localhost:3013';
const CACHE_SERVICE_API_KEY = process.env.CACHE_SERVICE_API_KEY || 'cache-service-secure-api-key-2024';
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS || 'http://localhost:3001,http://localhost:5173';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-super-secret-encryption-key-2024';
const RATE_LIMIT_WINDOW_MS = process.env.RATE_LIMIT_WINDOW_MS || 60000;
const RATE_LIMIT_MAX_REQUESTS = process.env.RATE_LIMIT_MAX_REQUESTS || 60000;
const MONGODB_MAX_POOL_SIZE = process.env.MONGODB_MAX_POOL_SIZE || 200;
const MONGODB_MIN_POOL_SIZE = process.env.MONGODB_MIN_POOL_SIZE || 50;
const MONGODB_MAX_IDLE_TIME_MS = process.env.MONGODB_MAX_IDLE_TIME_MS || 30000;
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
const NODE_ENV = process.env.NODE_ENV || 'development';

// Функции для шифрования/дешифрования токенов
function encryptToken(value) {
  if (!value) return '';
  
  try {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipher(algorithm, key);
    let encrypted = cipher.update(value, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    return value;
  }
}

function decryptToken(value) {
  if (!value) {
    return '';
  }
  
  // Проверяем, если токен равен строке 'undefined'
  if (value === 'undefined') {
    return '';
  }

  try {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
    
    const parts = value.split(':');
    
    if (parts.length !== 2) {
      // Если токен не зашифрован, возвращаем как есть
      return value;
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    
    const decipher = crypto.createDecipher(algorithm, key);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    // Если не удалось расшифровать, возвращаем как есть
    return value;
  }
}

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  maxPoolSize: MONGODB_MAX_POOL_SIZE,
  minPoolSize: MONGODB_MIN_POOL_SIZE,
  maxIdleTimeMS: MONGODB_MAX_IDLE_TIME_MS,
  retryWrites: false,
  w: 1,
  readPreference: 'primary',
  writeConcern: { w: 1, j: false },
  bufferCommands: false,
  autoIndex: false,
  autoCreate: false
}).then(() => {
  console.log('✅ Database Service: Connected to MongoDB');
  console.log(`📊 Pool Size: ${mongoose.connection.pool?.size() || 'unknown'}`);
}).catch((error) => {
  console.error('❌ Database Service: MongoDB connection error:', error);
  console.log('⚠️ Продолжаем работу без подключения к MongoDB');
});

// Middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));
app.use(compression());
// Morgan middleware for logging
// app.use(morgan('combined'));
app.use(cors({
  origin: ALLOWED_ORIGINS.split(','),
  credentials: true
}));

// Парсинг JSON с увеличенными лимитами
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Rate limiting для 60k ассистентов
const limiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX_REQUESTS,
  message: 'Too many requests from this IP',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  keyGenerator: (req) => {
    return req.ip || req.connection.remoteAddress || 'unknown';
  }
});

app.use(limiter);

// ===== ROUTES =====

// Multi-Chat Endpoints
app.use('/api/multi-chat', require('./routes/multi-chat'));

// Chat Naming Endpoint
app.use('/api/chat-naming', require('./routes/chat-naming'));

// AI Settings Endpoints
app.use('/api/ai-settings', aiSettingsRoutes);

// 🔍 Selected Providers Endpoints
app.use('/api/selected-providers', selectedProvidersRoutes);

// User Prompts Endpoints
app.use('/api/user-prompts', require('./routes/user-prompts'));

// System Prompts Endpoints
app.use('/api/system-prompts', require('./routes/system-prompts'));

// User Management Endpoints
app.use('/api/users', require('./routes/users'));

// Team Management Endpoints
app.use('/api/teams', require('./routes/teams'));

// Task Management Endpoints
app.use('/api/tasks', require('./routes/tasks'));

// Notification Management Endpoints
app.use('/api/notifications', require('./routes/notifications'));

// Project Settings Endpoints
app.use('/api/settings/project', projectSettingsRoutes);

// Telegram Bot Endpoints
app.use('/api/telegram/bots', telegramBotsRoutes);

// Chat History Endpoints
app.use('/api/chat-history', require('./routes/chat-history'));

// Authentication Endpoints
app.use('/api/auth', require('./routes/auth'));

// Utility Endpoints
app.use('/', require('./routes/utility'));

// AI Keys Endpoints
app.use('/api/ai-keys', require('./routes/ai-keys'));

// Provider Order Endpoints
app.use('/api/provider-order', providerOrderRoutes);

// Обработка ошибок
app.use((err, req, res, next) => {
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: 'Неожиданная ошибка сервера' 
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Not Found',
    message: 'Эндпоинт не найден' 
  });
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`🚀 Database Service running on port ${PORT}`);
  console.log(`📁 Routes loaded: ${Object.keys(app._router.stack).length - 4} routes`);
});

module.exports = app;
