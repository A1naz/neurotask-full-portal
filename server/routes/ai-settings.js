const express = require('express');
const router = express.Router();
const axios = require('axios');
const { requireAuth, requirePermission } = require('../middleware/auth');

// Импортируем константы из утилит
const { DATABASE_SERVICE_URL, DATABASE_SERVICE_API_KEY } = require('../utils');

// Получить AI настройки пользователя
router.get('/', requireAuth, requirePermission('ai-settings'), async (req, res) => {
  try {
    const userId = req.session.userId;
    
    const aiSettingsResponse = await axios.get(`${DATABASE_SERVICE_URL}/api/ai-settings/${userId}`, {
      headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
    });

    res.json(aiSettingsResponse.data);
  } catch (error) {
    const status = error.response ? error.response.status : 500;
    const message = error.response ? error.response.data.message : 'Ошибка получения AI настроек';
    res.status(status).json({
      success: false,
      message
    });
  }
});

// Обновить AI настройки пользователя
router.put('/', requireAuth, requirePermission('ai-settings'), async (req, res) => {
  try {
    const userId = req.session.userId;
    const updateData = req.body;
    
    const updateResponse = await axios.put(`${DATABASE_SERVICE_URL}/api/ai-settings/${userId}`, updateData, {
      headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
    });

    res.json(updateResponse.data);
  } catch (error) {
    const status = error.response ? error.response.status : 500;
    const message = error.response ? error.response.data.message : 'Ошибка обновления AI настроек';
    res.status(status).json({
      success: false,
      message
    });
  }
});

// Обновить конкретную настройку AI
router.patch('/:setting', requireAuth, requirePermission('ai-settings'), async (req, res) => {
  try {
    const userId = req.session.userId;
    const { setting } = req.params;
    const updateData = req.body;
    
       const updateResponse = await axios.patch(`${DATABASE_SERVICE_URL}/api/ai-settings/${userId}/${setting}`, updateData, {
     headers: { 'x-api-key': DATABASE_SERVICE_API_KEY }
   });

    res.json(updateResponse.data);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка обновления AI настройки'
    });
  }
});

module.exports = router;
