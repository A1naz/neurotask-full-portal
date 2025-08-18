const express = require('express');
const router = express.Router();
const axios = require('axios');
const { requireAuth } = require('../middleware/auth');

// Импортируем константы из утилит
const { DATABASE_SERVICE_URL, DATABASE_SERVICE_API_KEY } = require('../utils');

// Получить статус аутентификации календаря
router.get('/auth/status', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    
    // Пока возвращаем заглушку, так как интеграция не настроена
    res.json({
      success: true,
      authenticated: false,
      message: 'Google Calendar integration not configured'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка получения статуса аутентификации календаря'
    });
  }
});

// Получить URL для аутентификации
router.get('/auth/url', requireAuth, async (req, res) => {
  try {
    // Пока возвращаем заглушку
    res.json({
      success: true,
      authUrl: null,
      message: 'Google Calendar integration not configured'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка получения URL аутентификации'
    });
  }
});

// Получить события календаря
router.get('/events', requireAuth, async (req, res) => {
  try {
    const { timeMin, timeMax, maxResults = 10 } = req.query;
    
    // Пока возвращаем заглушку
    res.json({
      success: true,
      events: [],
      message: 'Google Calendar integration not configured'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка получения событий календаря'
    });
  }
});

// Тест интеграции с календарем
router.post('/test', requireAuth, async (req, res) => {
  try {
    // Пока возвращаем заглушку
    res.json({
      success: true,
      message: 'Google Calendar integration not configured'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка тестирования интеграции с календарем'
    });
  }
});

module.exports = router;
