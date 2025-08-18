const express = require('express');
const router = express.Router();
const axios = require('axios');

// Импортируем константы из утилит
const utils = require('../utils');
const { DATABASE_SERVICE_URL, DATABASE_SERVICE_API_KEY } = utils;

// Получить AI настройки пользователя
router.get('/settings', async (req, res) => {
  try {
    const userId = req.session.userId;
    
    const settingsResponse = await axios.get(`${DATABASE_SERVICE_URL}/api/settings/ai/${userId}`, {
      headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
    });

    res.json(settingsResponse.data);

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка получения AI настроек'
    });
  }
});

// Создать AI настройки
router.post('/settings', async (req, res) => {
  try {
    const userId = req.session.userId;
    const settings = req.body;
    
    const createResponse = await axios.post(`${DATABASE_SERVICE_URL}/api/settings/ai/${userId}`, {
      settings
    }, {
      headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
    });

    res.json(createResponse.data);

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка создания AI настроек'
    });
  }
});

// Обновить AI настройки
router.put('/settings', async (req, res) => {
  try {
    const userId = req.session.userId;
    const settings = req.body;
    
    const updateResponse = await axios.put(`${DATABASE_SERVICE_URL}/api/settings/ai/${userId}`, {
      settings
    }, {
      headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
    });

    res.json(updateResponse.data);

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка обновления AI настроек'
    });
  }
});

// Получить глобальные настройки проекта
router.get('/project-settings', async (req, res) => {
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

// Обновить глобальные настройки проекта
router.put('/project-settings', async (req, res) => {
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

module.exports = router;
