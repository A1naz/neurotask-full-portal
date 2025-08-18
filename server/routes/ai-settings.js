const express = require('express');
const router = express.Router();
const axios = require('axios');
const { requireAuth } = require('../middleware/auth');

// Импортируем константы из утилит
const { DATABASE_SERVICE_URL, DATABASE_SERVICE_API_KEY } = require('../utils');

// Получить AI настройки пользователя
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    
       const aiSettingsResponse = await axios.get(`${DATABASE_SERVICE_URL}/api/ai-settings/${userId}`, {
     headers: { 'x-api-key': DATABASE_SERVICE_API_KEY }
   });

    if (aiSettingsResponse.data.success && aiSettingsResponse.data.aiSettings) {
      // Преобразуем формат данных для фронтенда
      const aiSettings = aiSettingsResponse.data.aiSettings;
      
      // Проверяем существование activeProviders и defaultProvider
      const activeProviders = aiSettings.activeProviders || [];
      const defaultProvider = aiSettings.defaultProvider || 'openai';
      
      const aiProviders = {
        openai: activeProviders.includes('openai'),
        gemini: activeProviders.includes('gemini'),
        xai: activeProviders.includes('xai'),
        yandexgpt: activeProviders.includes('yandexgpt'),
        gigachat: activeProviders.includes('gigachat'),
        anthropic: activeProviders.includes('anthropic'),
        deepseek: activeProviders.includes('deepseek')
      };

      res.json({
        success: true,
        aiProviders: aiProviders,
        defaultProvider: defaultProvider
      });
    } else {
      // Если настройки не найдены, возвращаем значения по умолчанию
      res.json({
        success: true,
        aiProviders: {
          openai: false,
          gemini: false,
          xai: false,
          yandexgpt: false,
          gigachat: false,
          anthropic: false,
          deepseek: false
        },
        defaultProvider: 'openai'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка получения AI настроек'
    });
  }
});

// Обновить AI настройки пользователя
router.post('/', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const updateData = req.body;
    
    // Преобразуем формат данных для database-service
    if (updateData.aiProviders) {
      const activeProviders = Object.entries(updateData.aiProviders)
        .filter(([key, enabled]) => enabled)
        .map(([key]) => key);
      
      const updateDataForDB = {
        activeProviders: activeProviders
      };
      
             const updateResponse = await axios.put(`${DATABASE_SERVICE_URL}/api/ai-settings/${userId}`, updateDataForDB, {
         headers: { 'x-api-key': DATABASE_SERVICE_API_KEY }
       });

      res.json(updateResponse.data);
    } else {
      res.status(400).json({
        success: false,
        message: 'Неверный формат данных'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка обновления AI настроек'
    });
  }
});

// Обновить конкретную настройку AI
router.patch('/:setting', requireAuth, async (req, res) => {
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
