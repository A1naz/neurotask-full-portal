const express = require('express');
const router = express.Router();
const { requireApiKey } = require('../middleware/auth');
const ProjectSettings = require('../models/ProjectSettings');

// ===== PROJECT SETTINGS ENDPOINTS =====

// Получить настройки проекта
router.get('/', requireApiKey, async (req, res) => {
  try {
    const settings = await ProjectSettings.getGlobalSettings();
    
    res.json({
      success: true,
      settings: settings
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Ошибка получения настроек проекта'
    });
  }
});

// Обновить настройки проекта
router.post('/', requireApiKey, async (req, res) => {
  try {
    const updateData = req.body;
    
    const settings = await ProjectSettings.updateGlobalSettings(updateData);

    res.json({
      success: true,
      message: 'Настройки проекта обновлены',
      settings: settings
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Ошибка обновления настроек проекта'
    });
  }
});

module.exports = router;
