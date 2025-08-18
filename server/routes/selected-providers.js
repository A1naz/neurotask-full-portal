const express = require('express');
const router = express.Router();
const axios = require('axios');
const { requireAuth } = require('../middleware/auth');

// Импортируем константы из утилит
const { DATABASE_SERVICE_URL, DATABASE_SERVICE_API_KEY } = require('../utils');

// 🔍 МАРШРУТЫ ДЛЯ SELECTED-PROVIDERS (прокси к database-service)

// Получить выбранные провайдеры для пользователя
router.get('/:userId', requireAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Проверяем, что пользователь запрашивает свои данные
    if (req.session.userId !== userId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Доступ запрещен'
      });
    }
    
    // Получаем данные из database-service
    const response = await axios.get(`${DATABASE_SERVICE_URL}/api/selected-providers/${userId}`, {
      headers: { 'x-api-key': DATABASE_SERVICE_API_KEY }
    });

    res.json(response.data);
  } catch (error) {
    console.error('Error fetching selected providers:', error.message);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Ошибка получения выбранных провайдеров'
    });
  }
});

// Обновить выбранные провайдеры для пользователя
router.put('/:userId', requireAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { selectedProviders } = req.body;
    
    // Проверяем, что пользователь обновляет свои данные
    if (req.session.userId !== userId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Доступ запрещен'
      });
    }
    
    // Обновляем данные в database-service
    const response = await axios.put(`${DATABASE_SERVICE_URL}/api/selected-providers/${userId}`, {
      selectedProviders
    }, {
      headers: { 'x-api-key': DATABASE_SERVICE_API_KEY }
    });

    res.json(response.data);
  } catch (error) {
    console.error('Error updating selected providers:', error.message);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Ошибка обновления выбранных провайдеров'
    });
  }
});

module.exports = router;
