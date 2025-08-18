const express = require('express');
const router = express.Router();
const axios = require('axios');
const { requireAuth } = require('../middleware/auth');

// Импортируем константы из утилит
const utils = require('../utils');
const { DATABASE_SERVICE_URL, DATABASE_SERVICE_API_KEY } = utils;

// Получить уведомления пользователя
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const { limit = 50, offset = 0, unreadOnly = false, type = null } = req.query;
    
    const notificationsResponse = await axios.get(`${DATABASE_SERVICE_URL}/api/notifications/${userId}`, {
      params: { limit, offset, unreadOnly, type },
      headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
    });

    res.json(notificationsResponse.data);

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка получения уведомлений'
    });
  }
});

// Создать уведомление
router.post('/', requireAuth, async (req, res) => {
  try {
    const notificationData = req.body;
    
    const createResponse = await axios.post(`${DATABASE_SERVICE_URL}/api/notifications`, {
      ...notificationData,
      userId: req.session.userId
    }, {
      headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
    });

    res.json(createResponse.data);

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка создания уведомления'
    });
  }
});

// Отметить уведомление как прочитанное
router.patch('/:notificationId/read', requireAuth, async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.session.userId;
    
    const updateResponse = await axios.patch(`${DATABASE_SERVICE_URL}/api/notifications/${notificationId}/read`, {
      userId
    }, {
      headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
    });

    res.json(updateResponse.data);

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка отметки уведомления как прочитанного'
    });
  }
});

// Отметить все уведомления как прочитанные
router.patch('/read-all', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    
    const updateResponse = await axios.patch(`${DATABASE_SERVICE_URL}/api/notifications/${userId}/read-all`, {}, {
      headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
    });

    res.json(updateResponse.data);

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка отметки всех уведомлений как прочитанных'
    });
  }
});

// Удалить уведомление
router.delete('/:notificationId', requireAuth, async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.session.userId;
    
    const deleteResponse = await axios.delete(`${DATABASE_SERVICE_URL}/api/notifications/${notificationId}`, {
      data: { userId },
      headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
    });

    res.json(deleteResponse.data);

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка удаления уведомления'
    });
  }
});

// Получить настройки уведомлений
router.get('/settings', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const settingsResponse = await axios.get(`${DATABASE_SERVICE_URL}/api/notifications/${userId}/settings`, {
      headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
    });

    res.json(settingsResponse.data);

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка получения настроек уведомлений'
    });
  }
});

// Обновить настройки уведомлений
router.put('/settings', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const settings = req.body;
    
    const updateResponse = await axios.put(`${DATABASE_SERVICE_URL}/api/notifications/${userId}/settings`, {
      settings
    }, {
      headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
    });

    res.json(updateResponse.data);

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка обновления настроек уведомлений'
    });
  }
});

// Создать настройки уведомлений по умолчанию
router.post('/settings/default', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    
    const createResponse = await axios.post(`${DATABASE_SERVICE_URL}/api/notifications/${userId}/settings/default`, {}, {
      headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
    });

    res.json(createResponse.data);

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка создания настроек уведомлений по умолчанию'
    });
  }
});

// Получить статистику уведомлений
router.get('/stats', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    
    const statsResponse = await axios.get(`${DATABASE_SERVICE_URL}/api/notifications/${userId}/stats`, {
      headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
    });

    res.json(statsResponse.data);

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка получения статистики уведомлений'
    });
  }
});

module.exports = router;
