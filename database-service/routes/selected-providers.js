const express = require('express');
const router = express.Router();
const { requireApiKey } = require('../middleware/auth');
const AISettings = require('../models/AISettings');

// 🔍 Получить выбранные провайдеры для мультичата
router.get('/:userId', requireApiKey, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Используем findOneAndUpdate для создания документа если не существует
    let aiSettings = await AISettings.findOneAndUpdate(
      { userId },
      { 
        $setOnInsert: { userId } // Создаем документ если не существует
      },
      { 
        new: true, // Возвращаем документ
        upsert: true, // Создаем если не существует
        runValidators: true // Запускаем валидацию
      }
    );
    
    const selectedProviders = aiSettings.selectedProviders || [];
    
    res.json({
      success: true,
      selectedProviders: selectedProviders
    });
  } catch (error) {
    console.error('Database Service Error fetching selected providers:', error.message);
    
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Ошибка получения выбранных провайдеров',
      details: error.message
    });
  }
});

// 🔍 Обновить выбранные провайдеры для мультичата
router.put('/:userId', requireApiKey, async (req, res) => {
  try {
    const { userId } = req.params;
    const { selectedProviders } = req.body;
    
    if (!Array.isArray(selectedProviders)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'selectedProviders должен быть массивом'
      });
    }
    
    // Используем findOneAndUpdate для избежания конфликтов версий
    const aiSettings = await AISettings.findOneAndUpdate(
      { userId },
      { 
        $set: { selectedProviders },
        $setOnInsert: { userId } // Создаем документ если не существует
      },
      { 
        new: true, // Возвращаем обновленный документ
        upsert: true, // Создаем если не существует
        runValidators: true // Запускаем валидацию
      }
    );
    
    res.json({
      success: true,
      selectedProviders: aiSettings.selectedProviders
    });
  } catch (error) {
    console.error('Database Service Error updating selected providers:', error.message);
    
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Ошибка обновления выбранных провайдеров',
      details: error.message
    });
  }
});

module.exports = router;
