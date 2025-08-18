const express = require('express');
const router = express.Router();
const axios = require('axios');
const { requireAuth } = require('../middleware/auth');

// Импортируем константы из утилит
const { DATABASE_SERVICE_URL, DATABASE_SERVICE_API_KEY } = require('../utils');

// Получить данные дашборда
router.get('/data', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    
    // Получаем данные пользователя
    let user = null;
    try {
      const userResponse = await axios.get(`${DATABASE_SERVICE_URL}/api/users/${userId}`, {
        headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
      });
      user = userResponse.data;
    } catch (userError) {
      user = { _id: userId, email: 'unknown' };
    }

    // Получаем баланс
    let balance = null;
    try {
      const balanceResponse = await axios.get(`${DATABASE_SERVICE_URL}/api/users/${userId}/balance`, {
        headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
      });
      balance = balanceResponse.data;
    } catch (balanceError) {
      balance = { balance: 0, transactions: [] };
    }

    // Получаем настройки AI
    let aiSettings = null;
    try {
      const aiSettingsResponse = await axios.get(`${DATABASE_SERVICE_URL}/api/ai-settings/${userId}`, {
        headers: { 'x-api-key': DATABASE_SERVICE_API_KEY }
      });
      aiSettings = aiSettingsResponse.data;
    } catch (aiError) {
      aiSettings = { activeProviders: ['openai'], defaultProvider: 'openai' };
    }

    // Получаем команды пользователя
    let teams = [];
    try {
      const teamsResponse = await axios.get(`${DATABASE_SERVICE_URL}/api/teams/user/${userId}`, {
        headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
      });
      teams = teamsResponse.data;
    } catch (teamsError) {
      teams = [];
    }

    // Получаем данные Telegram бота
    let botStats = null;
    try {
      const botResponse = await axios.get(`${DATABASE_SERVICE_URL}/api/telegram/bots/${userId}`, {
        headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
      });
      
      if (botResponse.data?.botSettings) {
        const bot = botResponse.data.botSettings;
        const now = new Date();
        const activated = bot.activatedAt ? new Date(bot.activatedAt) : null;
        
        botStats = {
          isActive: bot.isActive || false,
          messagesProcessed: bot.messageCount || 0,
          uptime: activated ? now - activated : 0,
          lastActivity: bot.lastActivity || null,
          activatedAt: bot.activatedAt || null
        };
      }
    } catch (botError) {
      botStats = {
        isActive: false,
        messagesProcessed: 0,
        uptime: 0,
        lastActivity: null,
        activatedAt: null
      };
    }

    // Формируем данные дашборда
    const dashboardData = {
      user: user,
      balance: balance,
      aiSettings: aiSettings,
      teams: teams,
      botStats: botStats,
      integrations: {
        googleCalendar: {
          enabled: false // Пока отключаем, так как интеграция не настроена
        }
      }
    };

    res.json(dashboardData);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка получения данных дашборда',
      error: error.message
    });
  }
});

// Получить статистику бота
router.get('/bot-stats', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    
    // Пока возвращаем заглушку
    res.json({
      success: true,
      stats: {
        totalMessages: 0,
        activeUsers: 0,
        lastActivity: null
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка получения статистики бота'
    });
  }
});

// Получить токены для интеграций
router.get('/tokens', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    
    // Пока возвращаем заглушку
    res.json({
      success: true,
      tokens: {
        telegramBotToken: null,
        googleClientId: null,
        googleClientSecret: null
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка получения токенов'
    });
  }
});

// Получить токен Telegram бота
router.get('/tokens/telegramBotToken', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    
    // Пока возвращаем заглушку
    res.json({
      success: true,
      token: null
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка получения токена Telegram бота'
    });
  }
});

// Получить Google Client ID
router.get('/tokens/googleClientId', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    
    // Пока возвращаем заглушку
    res.json({
      success: true,
      clientId: null
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка получения Google Client ID'
    });
  }
});

// Получить настройки дашборда
router.get('/settings', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    
    // Пока возвращаем заглушку
    res.json({
      success: true,
      settings: {
        theme: 'light',
        language: 'ru',
        notifications: true
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка получения настроек дашборда'
    });
  }
});

module.exports = router;
