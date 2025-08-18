const express = require('express');
const router = express.Router();
const { requireApiKey } = require('../middleware/auth');

// Получить кастомный промпт пользователя
router.get('/:userId/custom-prompt', requireApiKey, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Пока возвращаем заглушку
    res.json({
      success: true,
      customPrompt: 'Ваш кастомный промпт для MultiChat'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Ошибка получения кастомного промпта'
    });
  }
});

// Сохранить кастомный промпт пользователя
router.post('/:userId/custom-prompt', requireApiKey, async (req, res) => {
  try {
    const { userId } = req.params;
    const { customPrompt } = req.body;
    
    if (!customPrompt) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'customPrompt обязателен'
      });
    }
    
    // Пока возвращаем заглушку
    res.json({
      success: true,
      message: 'Кастомный промпт сохранен'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Ошибка сохранения кастомного промпта'
    });
  }
});

module.exports = router;
