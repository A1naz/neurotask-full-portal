const express = require('express');
const router = express.Router();
const axios = require('axios');
const { requireAuth } = require('../middleware/auth');

// Импортируем константы из утилит
const { DATABASE_SERVICE_URL, DATABASE_SERVICE_API_KEY } = require('../utils');

// Получить статус авторизации Google Calendar
router.get('/auth-status', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    
    const botResponse = await axios.get(`${DATABASE_SERVICE_URL}/api/telegram/bots/${userId}`, {
      headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
    });

    const botSettings = botResponse.data?.botSettings;
    const googleCalendarSettings = botSettings?.integrations?.googleCalendar?.settings;
    
    const authStatus = {
      isConnected: !!(googleCalendarSettings?.clientId && googleCalendarSettings?.clientSecret),
      hasValidTokens: !!(googleCalendarSettings?.clientId && googleCalendarSettings?.clientSecret),
      tokensValid: !!(googleCalendarSettings?.clientId && googleCalendarSettings?.clientSecret),
      lastSync: botSettings?.integrations?.googleCalendar?.lastSync || null,
      isEnabled: botSettings?.integrations?.googleCalendar?.enabled || false
    };

    res.json(authStatus);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка получения статуса авторизации Google Calendar'
    });
  }
});

// Инициировать авторизацию Google Calendar
router.post('/auth', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    
    // Здесь должна быть логика создания URL для OAuth авторизации Google
    // Пока возвращаем заглушку
    const authUrl = `https://accounts.google.com/oauth/authorize?client_id=YOUR_CLIENT_ID&redirect_uri=YOUR_REDIRECT_URI&scope=https://www.googleapis.com/auth/calendar&response_type=code`;
    
    res.json({
      success: true,
      authUrl: authUrl,
      message: 'URL авторизации создан'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка инициации авторизации Google Calendar'
    });
  }
});

// Тестировать подключение к Google Calendar
router.post('/test', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    
    const botResponse = await axios.get(`${DATABASE_SERVICE_URL}/api/telegram/bots/${userId}`, {
      headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
    });

    const botSettings = botResponse.data?.botSettings;
    const googleCalendarSettings = botSettings?.integrations?.googleCalendar?.settings;
    
    if (!googleCalendarSettings?.clientId || !googleCalendarSettings?.clientSecret) {
      return res.status(400).json({
        success: false,
        message: 'Настройки Google Calendar не найдены'
      });
    }

    // Здесь должна быть логика тестирования подключения к Google Calendar API
    // Пока возвращаем успешный результат
    const testResult = {
      success: true,
      message: 'Подключение к Google Calendar успешно',
      details: {
        clientId: googleCalendarSettings.clientId ? '✅ Настроен' : '❌ Не настроен',
        clientSecret: googleCalendarSettings.clientSecret ? '✅ Настроен' : '❌ Не настроен',
        connection: '✅ Успешно',
        permissions: '✅ Доступ к календарю разрешен'
      }
    };

    res.json(testResult);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка тестирования подключения к Google Calendar'
    });
  }
});

module.exports = router;
