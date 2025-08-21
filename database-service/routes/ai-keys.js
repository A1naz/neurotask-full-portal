const express = require('express');
const router = express.Router();
const AIKey = require('../models/AIKeys');
const aiSettings = require('../models/AISettings');
const { requireApiKey } = require('../middleware/auth');

// Получить кастомный промпт пользователя
router.get('/:aiProvider', requireApiKey, async (req, res) => {
  try {
    const { aiProvider } = req.params;

    const aiKey = await AIKey.findOne({ aiProvider });

    const aiSetting = await aiSettings.findOne();
    console.log(aiSetting);
    if (!aiKey) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'AI ключ не найден :(('
      });
    }
 
    res.json({
      success: true,
      aiKey: aiKey
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Ошибка получения AI ключа'
    });
  }
});

module.exports = router;
