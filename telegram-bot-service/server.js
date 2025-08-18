require('dotenv').config({ path: './.env' });

// Telegram Bot Service

const express = require('express');
const cors = require('cors');
const TelegramBotProcess = require('./telegram-bot-process');

// Cache Client
const CacheClient = require('./cacheClient');
const cacheClient = new CacheClient();

// Routes
const teamsRoutes = require('./routes/teams');

const PORT = process.env.TELEGRAM_BOT_SERVICE_PORT || 3003;

const app = express();

// Middleware
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));

app.use(express.json());

// Teams API
app.use('/api/teams', teamsRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Telegram Bot Service',
    timestamp: new Date().toISOString()
  });
});

// API status endpoint
app.get('/api/status', (req, res) => {
  res.json({
    success: true,
    service: 'Telegram Bot Service',
    status: 'running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

async function start() {
  try {
    // Запуск сервера
    app.listen(PORT, () => {
      console.log(`🚀 Telegram Bot Service запущен на порту ${PORT}`);
    });

    // Запуск процесса Telegram-бота
    const botProcess = new TelegramBotProcess();
    await botProcess.start();
  } catch (error) {
    process.exit(1);
  }
}

start();