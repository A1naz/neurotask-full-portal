const express = require('express');
const router = express.Router();
const axios = require('axios');
const { requireAuth } = require('../middleware/auth');

// Импортируем константы и функции из утилит
const utils = require('../utils');
const { 
  DATABASE_SERVICE_URL, 
  DATABASE_SERVICE_API_KEY,
  getTelegramBotSafely,
  createDefaultTelegramBotSettings,
  isGoogleCalendarConfigured
} = utils;

// Получить Telegram бота пользователя
router.get('/telegram', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    
    const bot = await getTelegramBotSafely(userId);
    
    if (!bot) {
      return res.status(404).json({
        success: false,
        message: 'Telegram бот не найден'
      });
    }

    res.json({
      success: true,
      bot: bot
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка получения Telegram бота'
    });
  }
});

// Создать или обновить Telegram бота
router.post('/telegram', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const { token, settings = {} } = req.body;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Токен бота обязателен'
      });
    }

    // Получаем существующего бота или создаем нового
    let bot = await getTelegramBotSafely(userId);
    
    if (!bot) {
      // Создаем настройки по умолчанию
      const defaultSettings = createDefaultTelegramBotSettings(userId, token);
      const botData = {
        ...defaultSettings,
        ...settings,
        token
      };

      const createResponse = await axios.post(`${DATABASE_SERVICE_URL}/api/telegram/bots`, {
        botData
      }, {
        headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
      });

      bot = createResponse.data.botSettings;
    } else {
      // Обновляем существующего бота
      const updateData = {
        ...bot,
        ...settings,
        token
      };

      const updateResponse = await axios.put(`${DATABASE_SERVICE_URL}/api/telegram/bots/${userId}`, {
        botData: updateData
      }, {
        headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
      });

      bot = updateResponse.data.botSettings;
    }

    res.json({
      success: true,
      message: 'Telegram бот сохранен',
      bot: bot
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка сохранения Telegram бота'
    });
  }
});

// Обновить настройки Telegram бота
router.put('/telegram', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const updateData = req.body;
    
    const updateResponse = await axios.put(`${DATABASE_SERVICE_URL}/api/telegram/bots/${userId}`, {
      botData: updateData
    }, {
      headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
    });

    res.json({
      success: true,
      message: 'Настройки бота обновлены',
      bot: updateResponse.data.botSettings
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка обновления настроек бота'
    });
  }
});

// Удалить Telegram бота
router.delete('/telegram', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    
    const deleteResponse = await axios.delete(`${DATABASE_SERVICE_URL}/api/telegram/bots/${userId}`, {
      headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
    });

    res.json({
      success: true,
      message: 'Telegram бот удален'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка удаления Telegram бота'
    });
  }
});

// Активировать/деактивировать бота
router.patch('/telegram/status', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const { isActive } = req.body;
    
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'Поле isActive должно быть boolean'
      });
    }

    const updateResponse = await axios.put(`${DATABASE_SERVICE_URL}/api/telegram/bots/${userId}`, {
      botData: { isActive }
    }, {
      headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
    });

    res.json({
      success: true,
      message: `Бот ${isActive ? 'активирован' : 'деактивирован'}`,
      bot: updateResponse.data.botSettings
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка изменения статуса бота'
    });
  }
});

// Получить статистику бота
router.get('/telegram/stats', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    
    const statsResponse = await axios.get(`${DATABASE_SERVICE_URL}/api/telegram/bots/${userId}/stats`, {
      headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
    });

    res.json(statsResponse.data);

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка получения статистики бота'
    });
  }
});

// Обновить название компании бота
router.put('/telegram/company-name', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const { companyName } = req.body;
    
    if (!companyName || companyName.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Название компании обязательно'
      });
    }

    const updateResponse = await axios.put(`${DATABASE_SERVICE_URL}/api/telegram/bots/${userId}/company-name`, {
      companyName: companyName.trim()
    }, {
      headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
    });

    res.json({
      success: true,
      message: 'Название компании обновлено',
      companyName: companyName.trim()
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка обновления названия компании'
    });
  }
});

// Получить настройки Google Calendar
router.get('/telegram/google-calendar', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    
    const bot = await getTelegramBotSafely(userId);
    
    if (!bot) {
      return res.status(404).json({
        success: false,
        message: 'Telegram бот не найден'
      });
    }

    const isConfigured = isGoogleCalendarConfigured(bot);
    
    res.json({
      success: true,
      isConfigured,
      settings: bot.integrations?.googleCalendar?.settings || {}
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка получения настроек Google Calendar'
    });
  }
});

module.exports = router;
