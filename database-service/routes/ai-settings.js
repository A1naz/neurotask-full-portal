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
    
    // Ищем настройки пользователя
    const aiSettings = await AISettings.findOne({ userId: userId });
    if (!aiSettings) {
      // Проверяем, есть ли вообще записи в коллекции AISettings
      try {
        const allSettings = await AISettings.find({}).limit(5);
        console.log('🔍 Total AISettings in database:', await AISettings.countDocuments({}));
        console.log('🔍 Sample AISettings:', allSettings.map(s => ({ userId: s.userId, activeProviders: s.activeProviders })));
        
        // Проверяем конкретно наш userId
        const specificSearch = await AISettings.find({ userId: userId });
        console.log('🔍 Specific userId search result:', specificSearch);
      } catch (countError) {
        console.error('❌ Error counting AISettings:', countError);
      }
      
      return res.status(404).json({
        error: 'Not Found',
        message: 'AI настройки не найдены для пользователя'
      });
    }
    
    // Проверяем структуру activeProviders
    if (!Array.isArray(aiSettings.activeProviders)) {
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Некорректная структура activeProviders'
      });
    }
    
    // Преобразуем формат данных для фронтенда
    const aiProviders = {
      openai: aiSettings.activeProviders.includes('openai'),
      gemini: aiSettings.activeProviders.includes('gemini'),
      xai: aiSettings.activeProviders.includes('xai'),
      yandexgpt: aiSettings.activeProviders.includes('yandexgpt'),
      gigachat: aiSettings.activeProviders.includes('gigachat'),
      anthropic: aiSettings.activeProviders.includes('anthropic'),
      deepseek: aiSettings.activeProviders.includes('deepseek')
    };

    const responseData = {
      success: true,
      aiSettings: {
        activeProviders: aiSettings.activeProviders,
        defaultProvider: aiSettings.defaultProvider,
        selectedProviders: aiSettings.selectedProviders || []
      }
    };
    
    // console.log('🚀 Sending response:', JSON.stringify(responseData, null, 2));
    
    res.json(responseData);
  } catch (error) {
    console.error('❌ === AI SETTINGS ERROR ===');
    console.error('❌ Error getting AI settings:', error);
    console.error('❌ Error name:', error.name);
    console.error('❌ Error message:', error.message);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ === AI SETTINGS ERROR END ===');
    
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
    const updateData = req.body;
    
    let aiSettings = await AISettings.findByUserId(userId);
    
    if (!aiSettings) {
      // Создаем настройки по умолчанию если не найдены
      aiSettings = new AISettings({ userId });
    }
    
    // Обновляем поля
    if (updateData.activeProviders) {
      aiSettings.activeProviders = updateData.activeProviders;
    }
    
    if (updateData.defaultProvider) {
      aiSettings.defaultProvider = updateData.defaultProvider;
    }
    
    // 🔍 Обновляем выбранные провайдеры
    if (updateData.selectedProviders) {
      aiSettings.selectedProviders = updateData.selectedProviders;
    }
    
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
