const express = require('express');
const router = express.Router();
const { requireApiKey } = require('../middleware/auth');
const SystemPrompt = require('../models/SystemPrompt');
const mongoose = require('mongoose');

// ===== SYSTEM PROMPTS ENDPOINTS =====

// Получить все системные промпты
router.get('/', requireApiKey, async (req, res) => {
  try {
    const prompts = await SystemPrompt.find({})
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      prompts: prompts
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Ошибка получения системных промптов'
    });
  }
});

// Получить активный системный промпт
router.get('/active', requireApiKey, async (req, res) => {
  try {
    const activePrompt = await SystemPrompt.findOne({ isActive: true });
    
    if (!activePrompt) {
      return res.json({
        success: true,
        prompt: 'Multi-Chat Assistant',
        message: 'Default system prompt'
      });
    }

    res.json({
      success: true,
      prompt: activePrompt
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Ошибка получения активного системного промпта'
    });
  }
});

// Получить системный промпт по имени
router.get('/name/:promptName', requireApiKey, async (req, res) => {
  try {
    const { promptName } = req.params;
    
    const prompt = await SystemPrompt.findOne({ name: promptName });
    
    if (!prompt) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Системный промпт не найден'
      });
    }

    res.json({
      success: true,
      prompt: prompt
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Ошибка получения системного промпта по имени'
    });
  }
});

// Получить системный промпт по ID
router.get('/:id', requireApiKey, async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Неверный ID промпта'
      });
    }

    const prompt = await SystemPrompt.findById(id);
    
    if (!prompt) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Системный промпт не найден'
      });
    }

    res.json({
      success: true,
      prompt: prompt
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Ошибка получения системного промпта по ID'
    });
  }
});

module.exports = router;
