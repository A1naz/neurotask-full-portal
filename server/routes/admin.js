const express = require('express');
const router = express.Router();
const axios = require('axios');
const { requireAuth } = require('../middleware/auth');

// Импортируем константы из утилит
const utils = require('../utils');
const { DATABASE_SERVICE_URL, DATABASE_SERVICE_API_KEY } = utils;

// Middleware для проверки административных прав
const requireAdmin = async (req, res, next) => {
  try {
    const userId = req.session.userId;
    
    const userResponse = await axios.get(`${DATABASE_SERVICE_URL}/api/users/${userId}`, {
      headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
    });

    if (!userResponse.data.success) {
      return res.status(404).json({
        success: false,
        message: 'Пользователь не найден'
      });
    }

    const user = userResponse.data.user;
    
    if (!user.isAdmin && !user.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Требуются административные права'
      });
    }

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка проверки административных прав'
    });
  }
};

// Получить статистику базы данных
router.get('/database-stats', requireAuth, requireAdmin, async (req, res) => {
  try {
    const statsResponse = await axios.get(`${DATABASE_SERVICE_URL}/api/stats/database`, {
      headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
    });

    res.json(statsResponse.data);

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка получения статистики базы данных'
    });
  }
});

// Получить всех пользователей
router.get('/users', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50, search = '', status = null } = req.query;
    
    const usersResponse = await axios.get(`${DATABASE_SERVICE_URL}/api/users`, {
      params: { page, limit, search, status },
      headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
    });

    res.json(usersResponse.data);

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка получения пользователей'
    });
  }
});

// Получить статистику транзакций
router.get('/transactions', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50, type = null, startDate = null, endDate = null } = req.query;
    
    // Получаем статистику по всем пользователям
    const statsResponse = await axios.get(`${DATABASE_SERVICE_URL}/api/users/transactions`, {
      params: { page, limit, type, startDate, endDate, includeStats: true },
      headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
    });

    res.json(statsResponse.data);

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка получения статистики транзакций'
    });
  }
});

// Получить статистику Telegram ботов
router.get('/bots-stats', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { startDate = null, endDate = null } = req.query;
    
    // Получаем все активные боты
    const botsResponse = await axios.get(`${DATABASE_SERVICE_URL}/api/telegram/bots`, {
      params: { startDate, endDate },
      headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
    });

    if (!botsResponse.data.success) {
      throw new Error('Ошибка получения ботов');
    }

    const bots = botsResponse.data.telegramBots || [];
    
    // Собираем статистику по ботам
    const stats = {
      totalBots: bots.length,
      activeBots: bots.filter(bot => bot.isActive).length,
      inactiveBots: bots.filter(bot => !bot.isActive).length,
      totalUsers: bots.length, // Каждый бот = один пользователь
      aiProviders: {},
      integrations: {
        googleCalendar: 0,
        other: 0
      }
    };

    bots.forEach(bot => {
      // Статистика по AI провайдерам
      const provider = bot.aiProvider || 'unknown';
      stats.aiProviders[provider] = (stats.aiProviders[provider] || 0) + 1;

      // Статистика по интеграциям
      if (bot.integrations?.googleCalendar?.enabled) {
        stats.integrations.googleCalendar++;
      } else {
        stats.integrations.other++;
      }
    });

    res.json({
      success: true,
      stats: stats,
      bots: bots
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка получения статистики ботов'
    });
  }
});

// Получить системные промпты
router.get('/system-prompts', requireAuth, requireAdmin, async (req, res) => {
  try {
    const promptsResponse = await axios.get(`${DATABASE_SERVICE_URL}/api/system-prompts`, {
      headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
    });

    res.json(promptsResponse.data);

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка получения системных промптов'
    });
  }
});

// Обновить системный промпт
router.put('/system-prompts/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const updateResponse = await axios.put(`${DATABASE_SERVICE_URL}/api/system-prompts/${id}`, {
      prompt: updateData
    }, {
      headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
    });

    res.json(updateResponse.data);

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка обновления системного промпта'
    });
  }
});

// Получить настройки проекта
router.get('/project-settings', requireAuth, requireAdmin, async (req, res) => {
  try {
    const settingsResponse = await axios.get(`${DATABASE_SERVICE_URL}/api/settings/project`, {
      headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
    });

    res.json(settingsResponse.data);

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка получения настроек проекта'
    });
  }
});

// Обновить настройки проекта
router.put('/project-settings', requireAuth, requireAdmin, async (req, res) => {
  try {
    const settings = req.body;
    
    const updateResponse = await axios.post(`${DATABASE_SERVICE_URL}/api/settings/project`, {
      settings
    }, {
      headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
    });

    res.json(updateResponse.data);

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка обновления настроек проекта'
    });
  }
});

// Получить статистику команд
router.get('/teams-stats', requireAuth, requireAdmin, async (req, res) => {
  try {
    // Получаем статистику по командам
    const stats = {
      totalTeams: 0,
      totalMembers: 0,
      activeTeams: 0,
      averageTeamSize: 0
    };

    // Здесь должна быть логика для получения статистики команд
    // Пока возвращаем базовую структуру
    res.json({
      success: true,
      stats: stats
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка получения статистики команд'
    });
  }
});

module.exports = router;
