const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const axios = require('axios');
require('dotenv').config({ path: './.env' });

// Routes
const teamsRoutes = require('./routes/teams');
const balanceRoutes = require('./routes/balance');

// Balance Service

// Database Service configuration
const DATABASE_SERVICE_URL = process.env.DATABASE_SERVICE_URL || 'http://localhost:3012';
const DATABASE_SERVICE_API_KEY = process.env.DATABASE_SERVICE_API_KEY || 'database-service-secure-api-key-2024';

// Cache Client
const CacheClient = require('./cacheClient');
const cacheClient = new CacheClient();

// Импорт сервисов
const balanceService = require('./services/balanceService');

const app = express();
const PORT = process.env.BALANCE_SERVICE_PORT || 3002;

// Middleware
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));

// Парсинг JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Teams API
app.use('/api/teams', teamsRoutes);

// Balance API
app.use('/api/balance', balanceRoutes);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 100, // максимум 100 запросов с одного IP
  message: 'Слишком много запросов с этого IP, попробуйте позже'
});
app.use('/api/', limiter);

// Middleware для проверки API ключа
const requireApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'] || req.query.apiKey;
  
  if (!apiKey || apiKey !== process.env.BALANCE_SERVICE_API_KEY) {
    return res.status(401).json({ 
      error: 'Unauthorized',
      message: 'Неверный API ключ' 
    });
  }
  
  next();
};

// Middleware для валидации пользователя
const validateUser = async (req, res, next) => {
  const { userId } = req.params;
  
  if (!userId) {
    return res.status(400).json({ 
      error: 'Bad Request',
      message: 'ID пользователя обязателен' 
    });
  }
  
  try {
    const response = await axios.get(`${DATABASE_SERVICE_URL}/api/users/${userId}`, {
      headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
    });
    
    const user = response.data.user;
    if (!user) {
      return res.status(404).json({ 
        error: 'Not Found',
        message: 'Пользователь не найден' 
      });
    }
    
    req.user = user;
    next();
  } catch (error) {
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Ошибка валидации пользователя' 
    });
  }
};

// API Routes

// Получить баланс пользователя
app.get('/api/balance/:userId', requireApiKey, validateUser, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Получаем баланс через database-service
    const response = await axios.get(`${DATABASE_SERVICE_URL}/api/users/${userId}/balance`, {
      headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
    });
    const balanceData = response.data;
    
    res.json({
      success: true,
      balance: balanceData.balance,
      user: balanceData.user
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Ошибка получения баланса' 
    });
  }
});

// Списать токены
app.post('/api/balance/:userId/deduct', requireApiKey, validateUser, async (req, res) => {
  try {
    const { userId } = req.params;
    const { amount, description, metadata } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ 
        error: 'Bad Request',
        message: 'Количество токенов должно быть больше 0' 
      });
    }
    
    // Используем balance-service для списания токенов через очередь
    const result = await balanceService.deductTokens(userId, amount, description, metadata);
    
    res.json(result);
  } catch (error) {
    if (error.response?.data?.error === 'Insufficient Balance') {
      return res.status(400).json({ 
        error: 'Insufficient Balance',
        message: error.response.data.message 
      });
    }
    
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Ошибка списания токенов' 
    });
  }
});

// Пополнить токены
app.post('/api/balance/:userId/add', requireApiKey, validateUser, async (req, res) => {
  try {
    const { userId } = req.params;
    const { amount, description, metadata } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ 
        error: 'Bad Request',
        message: 'Количество токенов должно быть больше 0' 
      });
    }
    
    // Используем balance-service для пополнения токенов через очередь
    const result = await balanceService.addTokens(userId, amount, description, metadata);
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Ошибка пополнения токенов' 
    });
  }
});

// Получить историю транзакций
app.get('/api/balance/:userId/transactions', requireApiKey, validateUser, async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20, type } = req.query;
    
    const query = { userId };
    if (type) {
      query.type = type;
    }
    
    const response = await axios.get(`${DATABASE_SERVICE_URL}/api/token-transactions/user/${userId}`, {
      params: { page, limit, type },
      headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
    });
    
    const { transactions, pagination } = response.data;
    
    res.json({
      success: true,
      transactions,
      pagination
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Ошибка получения истории транзакций' 
    });
  }
});

// Получить статистику транзакций
app.get('/api/balance/:userId/stats', requireApiKey, validateUser, async (req, res) => {
  try {
    const { userId } = req.params;
    const { period = '30d' } = req.query;
    
    let startDate;
    const now = new Date();
    
    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
    
    const [spentStatsResponse, addedStatsResponse] = await Promise.all([
      axios.get(`${DATABASE_SERVICE_URL}/api/token-transactions/stats/${userId}`, {
        params: { type: 'spend', startDate: startDate.toISOString() },
        headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
      }),
      axios.get(`${DATABASE_SERVICE_URL}/api/token-transactions/stats/${userId}`, {
        params: { type: 'top_up', startDate: startDate.toISOString() },
        headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
      })
    ]);
    
    const spentStats = spentStatsResponse.data;
    const addedStats = addedStatsResponse.data;
    
    const spent = spentStats[0] || { total: 0, count: 0 };
    const added = addedStats[0] || { total: 0, count: 0 };
    
    res.json({
      success: true,
      stats: {
        period,
        spent: {
          total: spent.total,
          count: spent.count
        },
        added: {
          total: added.total,
          count: added.count
        },
        netChange: added.total - spent.total
      }
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Ошибка получения статистики' 
    });
  }
});

// Проверить статус сервиса
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    service: 'Balance Service',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Получить статистику очередей
app.get('/api/queue/stats', requireApiKey, async (req, res) => {
  try {
    const stats = await balanceService.getQueueStats();
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Ошибка получения статистики очередей' 
    });
  }
});

// Получить статус задачи
app.get('/api/queue/job/:jobId', requireApiKey, async (req, res) => {
  try {
    const { jobId } = req.params;
    const { type = 'deduct' } = req.query;
    
    const queueService = require('./services/queueService');
    const status = await queueService.getJobStatus(jobId, type);
    
    res.json({
      success: true,
      status
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Ошибка получения статуса задачи' 
    });
  }
});

// Очистить старые задачи
app.post('/api/queue/clean', requireApiKey, async (req, res) => {
  try {
    const result = await balanceService.cleanOldJobs();
    res.json({
      success: true,
      message: 'Старые задачи очищены',
      result
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Ошибка очистки старых задач' 
    });
  }
});

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
  console.log(`🚀 Balance Service запущен на порту ${PORT}`);
});

module.exports = app; 