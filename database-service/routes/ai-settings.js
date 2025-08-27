const express = require('express');
const router = express.Router();
const { requireApiKey } = require('../middleware/auth');
const AISettings = require('../models/AISettings');

// Получить AI настройки пользователя
router.get('/:userId', requireApiKey, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Проверяем валидность ObjectId
    if (!userId || !require('mongoose').Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Неверный формат userId'
      });
    }
    
    let aiSettings = await AISettings.findOne({ userId: userId });
    console.log("aiSettings", aiSettings);
    
    // Если настроек нет, создаем по умолчанию
    if (!aiSettings) {
      aiSettings = new AISettings({ userId: userId });
      await aiSettings.save();
    }
    
    const aiProviders = {
      openai: aiSettings.activeProviders.includes('openai'),
      gemini: aiSettings.activeProviders.includes('gemini'),
      xai: aiSettings.activeProviders.includes('xai'),
      yandexgpt: aiSettings.activeProviders.includes('yandexgpt'),
      gigachat: aiSettings.activeProviders.includes('gigachat'),
      anthropic: aiSettings.activeProviders.includes('anthropic'),
      deepseek: aiSettings.activeProviders.includes('deepseek')
    };

    res.json({
      success: true,
      aiProviders,
      aiSettings: {
        activeProviders: aiSettings.activeProviders,
        selectedModels: aiSettings.selectedModels || {},
        defaultProvider: aiSettings.defaultProvider,
        selectedProviders: aiSettings.selectedProviders || []
      },
      activeProviders: aiSettings.activeProviders,
      selectedModels: aiSettings.selectedModels || {},
      defaultProvider: aiSettings.defaultProvider,
      selectedProviders: aiSettings.selectedProviders || []
    });
  } catch (error) {
    console.error('❌ Error getting AI settings:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Ошибка получения AI настроек'
    });
  }
});

// Обновить AI настройки пользователя
router.put('/:userId', requireApiKey, async (req, res) => {
  try {
    const { userId } = req.params;
    const { aiProviders, selectedModels } = req.body;
    
    let aiSettings = await AISettings.findByUserId(userId);
    
    if (!aiSettings) {
      aiSettings = new AISettings({ userId });
    }
    
    // Обновляем активные провайдеры
    if (aiProviders) {
      const activeProviders = Object.keys(aiProviders).filter(key => aiProviders[key]);
      aiSettings.activeProviders = activeProviders;
    }

    // Обновляем выбранные модели
    if (selectedModels) {
      aiSettings.selectedModels = selectedModels;
    }
    
    await aiSettings.save();
    
    res.json({
      success: true,
      message: 'Настройки AI успешно обновлены'
    });
  } catch (error) {
    console.error('Error updating AI settings:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Ошибка обновления AI настроек'
    });
  }
});

// Создать AI настройки по умолчанию для пользователя
router.post('/:userId', requireApiKey, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const existingSettings = await AISettings.findByUserId(userId);
    if (existingSettings) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'AI настройки уже существуют для этого пользователя'
      });
    }
    
    const aiSettings = new AISettings({ userId });
    await aiSettings.save();
    
    res.json({
      success: true,
      aiSettings: {
        activeProviders: aiSettings.activeProviders,
        defaultProvider: aiSettings.defaultProvider,
        selectedProviders: aiSettings.selectedProviders || []
      }
    });
  } catch (error) {
    console.error('Error creating AI settings:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Ошибка создания AI настроек'
    });
  }
});

module.exports = router;
