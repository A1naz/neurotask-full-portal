const express = require('express');
const cors = require('cors');
const session = require('express-session');
const FileStore = require('session-file-store')(session); // Добавляем эту строку
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const axios = require('axios');
const { google } = require('googleapis');
const { sendVerificationEmail, resendVerificationEmail } = require('./utils/emailService');

// Cache Client
const CacheClient = require('./cacheClient');
const cacheClient = new CacheClient();

require('dotenv').config({ path: './.env' });

// Fallback значения для основного сервера
const DATABASE_SERVICE_API_KEY = process.env.DATABASE_SERVICE_API_KEY || 'database-service-secure-api-key-2024';
const DATABASE_SERVICE_URL = process.env.DATABASE_SERVICE_URL || 'http://localhost:3012';
const CACHE_SERVICE_API_KEY = process.env.CACHE_SERVICE_API_KEY || 'cache-service-secure-api-key-2024';
const CACHE_SERVICE_URL = process.env.CACHE_SERVICE_URL || 'http://localhost:3013';
const BALANCE_SERVICE_API_KEY = process.env.BALANCE_SERVICE_API_KEY || 'balance-service-secure-api-key-2024';
const BALANCE_SERVICE_URL = process.env.BALANCE_SERVICE_URL || 'http://localhost:3002';

// Удалены неиспользуемые вспомогательные функции

// CSRF защита
const generateCSRFToken = (req, res, next) => {
  if (!req.session.csrfToken) {
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    req.session.csrfToken = token;
  }
  res.locals.csrfToken = req.session.csrfToken;
  next();
};

const validateCSRFToken = (req, res, next) => {
  const token = req.body._csrf || req.headers['x-csrf-token'];
  if (!token || token !== req.session.csrfToken) {
    return res.status(403).json({ message: 'Invalid CSRF token' });
  }
  next();
};

// Middleware для проверки аутентификации
const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  next();
};

// Создание Express приложения
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(compression());
// app.use(morgan('combined'));

// CORS настройки
const corsOptions = {
  origin: function (origin, callback) {
    // Разрешаем запросы без origin (например, из Postman)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3001', 
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'https://neurotask.ru',
      'https://www.neurotask.ru'
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'x-user-id', 'x-api-key'],
  exposedHeaders: ['X-CSRF-Token']
};

// Обработка OPTIONS запросов для CORS preflight
app.options('*', cors(corsOptions));

// Применяем CORS ко всем маршрутам
app.use(cors(corsOptions));

// Парсинг JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Session middleware
app.use(session({
  store: new FileStore({ path: './sessions', logFn: function(){} }), // Добавляем хранилище
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: true, // Изменено на true чтобы создавать сессии для всех
  cookie: {
    secure: process.env.NODE_ENV === 'production' || process.env.FORCE_SECURE_COOKIES === 'true',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    domain: process.env.NODE_ENV === 'production' ? '.neurotask.ru' : undefined
  }
}));

// CSRF защита только для POST/PUT/DELETE запросов
app.use((req, res, next) => {
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    generateCSRFToken(req, res, next);
    } else {
    next();
  }
});

// CSRF token endpoint (должен быть доступен без валидации)
app.get('/api/csrf-token', (req, res) => {
  // Генерируем CSRF токен для GET запроса если его нет
  if (!req.session.csrfToken) {
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    req.session.csrfToken = token;
  }
  res.json({ csrfToken: req.session.csrfToken });
});

// Дополнительный endpoint для фронтенда (без /api/ префикса)
app.get('/csrf-token', (req, res) => {
  // Генерируем CSRF токен для GET запроса если его нет
  if (!req.session.csrfToken) {
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    req.session.csrfToken = token;
  }
  res.json({ csrfToken: req.session.csrfToken });
});

// Исключения для CSRF валидации
app.use('/api/', (req, res, next) => {
  // Исключаем маршруты аутентификации и получения CSRF токена
  if (req.path === '/auth/login' || 
      req.path === '/auth/register' || 
      req.path === '/auth/verify-email' ||
      req.path === '/auth/resend-verification' ||
      req.path === '/csrf-token' ||
      req.path.startsWith('/harmex/') ||
      req.path.startsWith('/auth/')) {
    return next();
  }
  
  // Проверяем, что пользователь аутентифицирован перед CSRF валидацией
  if (!req.session.userId) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  // Применяем CSRF валидацию только для методов, которые изменяют состояние
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    validateCSRFToken(req, res, next);
  } else {
    // Для GET, HEAD, OPTIONS запросов просто пропускаем
    next();
  }
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Проверяем здоровье database-service
    const dbHealth = await axios.get(`${DATABASE_SERVICE_URL}/health`, {
      headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
    });
    
    res.json({ 
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: (dbHealth.data.status === 'ok' || dbHealth.data.status === 'healthy') ? 'healthy' : 'unhealthy',
        cache: 'healthy' // cacheClient уже проверяется
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message 
    });
  }
});

// Основные маршруты API
app.use('/api/teams', require('./routes/teams'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/bots', require('./routes/bots'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/balance', require('./routes/balance'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/admin', require('./routes/admin'));

// Новые маршруты для фронтенда
app.use('/api/tokens', require('./routes/tokens'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/ai-settings', require('./routes/ai-settings'));
app.use('/api/telegram-bot', require('./routes/telegram-bot'));
app.use('/api/google-calendar', require('./routes/google-calendar'));
app.use('/api/ping', require('./routes/ping'));
app.use('/api/api-keys', require('./routes/api-keys'));
app.use('/api/calendar', require('./routes/calendar'));
app.use('/api/multi-chat', require('./routes/multi-chat'));
app.use('/api/menu', require('./routes/menu')); // Подключаем новый роут
app.use('/api/permissions', require('./routes/permissions'));
app.use('/api/provider-order', require('./routes/provider-order'));
app.use('/api/contact-us', require('./routes/contact')); // Добавляем новый роут

// Прокси для эндпоинта именования чатов
app.use('/api/chat-naming', async (req, res) => {
  try {
    const response = await axios.post(`${DATABASE_SERVICE_URL}/api/chat-naming/generate-name`, req.body, {
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': req.headers['x-csrf-token'],
        'x-user-id': req.headers['x-user-id'],
        'x-api-key': DATABASE_SERVICE_API_KEY
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error proxying chat naming request:', error.message);
    res.status(error.response?.status || 500).json(error.response?.data || { message: 'Proxy error' });
  }
});
app.use('/api/harmex/review-text', async (req, res) => {
  try {
    const { key, productName } = req.query;

    const response = await axios.post(`${DATABASE_SERVICE_URL}/api/review-text/review-text`, 
      { key, productName },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': DATABASE_SERVICE_API_KEY
        }
      }
    );
    res.json(response.data);
  } catch (error) {
    console.error('Error proxying review text request:', error.message);
    res.status(error.response?.status || 500).json(error.response?.data || { message: 'Proxy error' });
  }
});

// 🔍 МАРШРУТЫ ДЛЯ SELECTED-PROVIDERS (прокси к database-service)
app.use('/api/selected-providers', require('./routes/selected-providers'));
app.use('/api/upload', require('./routes/upload'));

// Запуск сервера
const server = app.listen(PORT, () => {
  console.log(`🚀 Main Server запущен на порту ${PORT}`);
});

// Устанавливаем кастомный таймаут для сервера (10 минут)
server.setTimeout(600000);

// Экспортируем приложение
module.exports = app;