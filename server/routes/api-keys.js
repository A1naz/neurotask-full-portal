const express = require('express');
const router = express.Router();
const axios = require('axios');
const { requireAuth } = require('../middleware/auth');

// Импортируем константы из утилит
const { DATABASE_SERVICE_URL, DATABASE_SERVICE_API_KEY } = require('../utils');

// Получить все API ключи пользователя
router.get('/', requireAuth, async (req, res) => {
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

// Создать новый API ключ
router.post('/', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const { name, permissions } = req.body;
    
    const createResponse = await axios.post(`${DATABASE_SERVICE_URL}/api/users/${userId}/api-keys`, {
      name,
      permissions
    }, {
      headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
    });

    res.json(createResponse.data);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка создания API ключа'
    });
  }
});

// Обновить API ключ
router.put('/:keyId', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const { keyId } = req.params;
    const updateData = req.body;
    
    const updateResponse = await axios.put(`${DATABASE_SERVICE_URL}/api/users/${userId}/api-keys/${keyId}`, updateData, {
      headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
    });

    res.json(updateResponse.data);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка обновления API ключа'
    });
  }
});

// Удалить API ключ
router.delete('/:keyId', requireAuth, async (req, res) => {
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

module.exports = router;
