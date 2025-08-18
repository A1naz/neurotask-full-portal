const express = require('express');
const router = express.Router();
const axios = require('axios');
const { requireAuth } = require('../middleware/auth');

// Импортируем константы из утилит
const utils = require('../utils');
const { DATABASE_SERVICE_URL, DATABASE_SERVICE_API_KEY } = utils;

// Получить профиль пользователя
router.get('/profile', requireAuth, async (req, res) => {
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

    res.json({
      success: true,
      user: userResponse.data.user
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка получения профиля'
    });
  }
});

// Обновить профиль пользователя
router.put('/profile', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const updateData = req.body;
    
    // Убираем поля, которые нельзя обновлять
    delete updateData.password;
    delete updateData.email;
    delete updateData.verificationCode;
    delete updateData.verificationExpires;
    delete updateData.emailVerified;
    
    const userResponse = await axios.put(`${DATABASE_SERVICE_URL}/api/users/${userId}`, updateData, {
      headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
    });

    if (!userResponse.data.success) {
      return res.status(400).json({
        success: false,
        message: 'Ошибка обновления профиля'
      });
    }

    res.json({
      success: true,
      message: 'Профиль обновлен',
      user: userResponse.data.user
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка обновления профиля'
    });
  }
});

// Получить баланс пользователя
router.get('/balance', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    
    const balanceResponse = await axios.get(`${DATABASE_SERVICE_URL}/api/users/${userId}/balance`, {
      headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
    });

    res.json(balanceResponse.data);

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка получения баланса'
    });
  }
});

// Получить транзакции пользователя
router.get('/transactions', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const { page = 1, limit = 20, type = null } = req.query;
    
    const transactionsResponse = await axios.get(`${DATABASE_SERVICE_URL}/api/users/${userId}/transactions`, {
      params: { page, limit, type },
      headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
    });

    res.json(transactionsResponse.data);

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка получения транзакций'
    });
  }
});

// Получить API ключи пользователя
router.get('/api-keys', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    
    const apiKeysResponse = await axios.get(`${DATABASE_SERVICE_URL}/api/users/${userId}/api-keys`, {
      headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
    });

    res.json(apiKeysResponse.data);

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка получения API ключей'
    });
  }
});

// Создать API ключ
router.post('/api-keys', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const { name, permissions = {} } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Название API ключа обязательно'
      });
    }

    const apiKeyResponse = await axios.post(`${DATABASE_SERVICE_URL}/api/users/${userId}/api-keys`, {
      name,
      permissions
    }, {
      headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
    });

    res.json(apiKeyResponse.data);

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка создания API ключа'
    });
  }
});

// Удалить API ключ
router.delete('/api-keys/:keyId', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const { keyId } = req.params;
    
    const deleteResponse = await axios.delete(`${DATABASE_SERVICE_URL}/api/users/${userId}/api-keys/${keyId}`, {
      headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
    });

    res.json(deleteResponse.data);

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка удаления API ключа'
    });
  }
});

// Сохранить пользовательские настройки интерфейса
router.put('/:userId/settings', requireAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { interfaceSettings } = req.body;
    
    // Проверяем, что пользователь изменяет свои настройки
    if (req.session.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Недостаточно прав для изменения настроек другого пользователя'
      });
    }

    const response = await axios.put(`${DATABASE_SERVICE_URL}/api/users/${userId}/settings`, {
      interfaceSettings
    }, {
      headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
    });

    res.json(response.data);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка сохранения настроек'
    });
  }
});

// Получить пользовательские настройки интерфейса
router.get('/:userId/settings', requireAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Проверяем, что пользователь получает свои настройки
    if (req.session.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Недостаточно прав для получения настроек другого пользователя'
      });
    }

    const response = await axios.get(`${DATABASE_SERVICE_URL}/api/users/${userId}/settings`, {
      headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
    });

    res.json(response.data);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка получения настроек'
    });
  }
});

module.exports = router;
