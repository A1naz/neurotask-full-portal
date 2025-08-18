const express = require('express');
const router = express.Router();
const axios = require('axios');

// Database Service configuration
const DATABASE_SERVICE_URL = process.env.DATABASE_SERVICE_URL || 'http://localhost:3012';
const DATABASE_SERVICE_API_KEY = process.env.DATABASE_SERVICE_API_KEY || 'database-service-secure-api-key-2024';

// Получить уведомления пользователя
router.get('/', async (req, res) => {
  try {
    const { teamId, limit = 50, offset = 0, unreadOnly = false, type = null } = req.query;
    const userId = req.user._id;

    let url = `${DATABASE_SERVICE_URL}/api/team-notifications/user/${userId}?limit=${limit}&offset=${offset}`;
    
    if (teamId) url += `&teamId=${teamId}`;
    if (unreadOnly) url += '&unreadOnly=true';
    if (type) url += `&type=${type}`;

    const response = await axios.get(url, {
      headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
    });

    res.json({
      success: true,
      notifications: response.data
    });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка получения уведомлений' });
  }
});

// Отметить уведомление как прочитанное
router.put('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    // Проверяем, что уведомление принадлежит пользователю
    const notificationResponse = await axios.get(`${DATABASE_SERVICE_URL}/api/team-notifications/${id}`, {
      headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
    });

    const notification = notificationResponse.data;
    if (!notification || notification.userId.toString() !== userId.toString()) {
      return res.status(404).json({ message: 'Уведомление не найдено' });
    }

    // Отмечаем как прочитанное
    const updatedNotification = await axios.put(`${DATABASE_SERVICE_URL}/api/team-notifications/${id}`, {
      isRead: true,
      readAt: new Date()
    }, {
      headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
    });

    res.json({
      success: true,
      notification: updatedNotification.data
    });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка отметки уведомления как прочитанного' });
  }
});

// Отметить все уведомления как прочитанные
router.put('/mark-all-read', async (req, res) => {
  try {
    const { teamId } = req.query;
    const userId = req.user._id;

    let url = `${DATABASE_SERVICE_URL}/api/team-notifications/user/${userId}/mark-all-read`;
    if (teamId) url += `?teamId=${teamId}`;

    const response = await axios.put(url, {}, {
      headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
    });

    res.json({
      success: true,
      message: 'Все уведомления отмечены как прочитанные',
      result: response.data
    });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка отметки всех уведомлений как прочитанных' });
  }
});

// Архивировать уведомление
router.put('/:id/archive', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    // Проверяем, что уведомление принадлежит пользователю
    const notificationResponse = await axios.get(`${DATABASE_SERVICE_URL}/api/team-notifications/${id}`, {
      headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
    });

    const notification = notificationResponse.data;
    if (!notification || notification.userId.toString() !== userId.toString()) {
      return res.status(404).json({ message: 'Уведомление не найдено' });
    }

    // Архивируем уведомление
    const updatedNotification = await axios.put(`${DATABASE_SERVICE_URL}/api/team-notifications/${id}`, {
      isArchived: true,
      archivedAt: new Date()
    }, {
      headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
    });

    res.json({
      success: true,
      notification: updatedNotification.data
    });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка архивирования уведомления' });
  }
});

// Получить количество непрочитанных уведомлений
router.get('/unread-count', async (req, res) => {
  try {
    const { teamId } = req.query;
    const userId = req.user._id;

    let url = `${DATABASE_SERVICE_URL}/api/team-notifications/user/${userId}/unread-count`;
    if (teamId) url += `?teamId=${teamId}`;

    const response = await axios.get(url, {
      headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
    });

    res.json({
      success: true,
      count: response.data.count
    });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка получения количества непрочитанных уведомлений' });
  }
});

// Удалить уведомление
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    // Проверяем, что уведомление принадлежит пользователю
    const notificationResponse = await axios.get(`${DATABASE_SERVICE_URL}/api/team-notifications/${id}`, {
      headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
    });

    const notification = notificationResponse.data;
    if (!notification || notification.userId.toString() !== userId.toString()) {
      return res.status(404).json({ message: 'Уведомление не найдено' });
    }

    // Удаляем уведомление
    await axios.delete(`${DATABASE_SERVICE_URL}/api/team-notifications/${id}`, {
      headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
    });

    res.json({
      success: true,
      message: 'Уведомление удалено'
    });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка удаления уведомления' });
  }
});

// Получить настройки уведомлений
router.get('/settings', async (req, res) => {
  try {
    const userId = req.user._id;

    const response = await axios.get(`${DATABASE_SERVICE_URL}/api/team-notifications/settings/${userId}`, {
      headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
    });

    res.json({
      success: true,
      settings: response.data
    });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка получения настроек уведомлений' });
  }
});

// Обновить настройки уведомлений
router.put('/settings', async (req, res) => {
  try {
    const userId = req.user._id;
    const settings = req.body;

    const response = await axios.put(`${DATABASE_SERVICE_URL}/api/team-notifications/settings/${userId}`, settings, {
      headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
    });

    res.json({
      success: true,
      message: 'Настройки уведомлений обновлены',
      settings: response.data
    });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка обновления настроек уведомлений' });
  }
});

// Получить статистику уведомлений
router.get('/stats', async (req, res) => {
  try {
    const { teamId } = req.query;
    const userId = req.user._id;

    let url = `${DATABASE_SERVICE_URL}/api/team-notifications/stats/${userId}`;
    if (teamId) url += `?teamId=${teamId}`;

    const response = await axios.get(url, {
      headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
    });

    res.json({
      success: true,
      stats: response.data
    });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка получения статистики уведомлений' });
  }
});

module.exports = router;
