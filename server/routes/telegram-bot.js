const express = require('express');
const router = express.Router();
const axios = require('axios');
const { requireAuth } = require('../middleware/auth');

// Импортируем константы из утилит
const { DATABASE_SERVICE_URL, DATABASE_SERVICE_API_KEY } = require('../utils');

// Получить настройки Telegram бота
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    
    const botResponse = await axios.get(`${DATABASE_SERVICE_URL}/api/telegram/bots/${userId}`, {
      headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
    });

    res.json(botResponse.data);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка получения настроек Telegram бота'
    });
  }
});

// Получить AI провайдеры
router.get('/ai-providers', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    
    const aiSettingsResponse = await axios.get(`${DATABASE_SERVICE_URL}/api/ai-settings/${userId}`, {
      headers: { 'x-api-key': DATABASE_SERVICE_API_KEY }
    });

    const providers = aiSettingsResponse.data?.aiSettings?.activeProviders || ['openai'];
    
    res.json({
      success: true,
      providers: providers,
      aiProviders: providers // Добавляем дублирующее поле для совместимости с frontend
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка получения AI провайдеров'
    });
  }
});

// Валидировать токен бота
router.post('/validate', requireAuth, async (req, res) => {
  try {
    const { botToken } = req.body;
    
    if (!botToken) {
      return res.status(400).json({
        success: false,
        message: 'Токен бота обязателен'
      });
    }

    // Здесь должна быть логика валидации токена через Telegram API
    // Пока просто возвращаем успех
    res.json({
      success: true,
      message: 'Токен бота валиден'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка валидации токена бота'
    });
  }
});

// Получить статус бота
router.get('/status', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    
    const botResponse = await axios.get(`${DATABASE_SERVICE_URL}/api/telegram/bots/${userId}`, {
      headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
    });

    const botSettings = botResponse.data?.botSettings;
    
    res.json({
      success: true,
      isActive: botSettings?.isActive || false,
      hasToken: !!botSettings?.token,
      lastActivity: botSettings?.lastActivity || null
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка получения статуса бота'
    });
  }
});

// Получить статистику бота для вкладки "Обзор"
router.get('/stats', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    
    const botResponse = await axios.get(`${DATABASE_SERVICE_URL}/api/telegram/bots/${userId}`, {
      headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
    });

    const botSettings = botResponse.data?.botSettings;
    
    if (!botSettings) {
      return res.status(404).json({
        success: false,
        message: 'Бот не найден'
      });
    }

    // Возвращаем только поля, необходимые для вкладки "Обзор"
    const stats = {
      success: true,
      messageCount: botSettings.messageCount || 0,
      activatedAt: botSettings.activatedAt || null,
      lastActivity: botSettings.lastActivity || null
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка получения статистики бота'
    });
  }
});

// Создать/сохранить настройки бота
router.post('/', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const botData = req.body;
    
    // Определяем, нужно ли создавать нового бота или обновлять существующего
    let botResponse;
    let isNewBot = false;
    
    try {
      // Проверяем, существует ли бот
      const existingBotResponse = await axios.get(`${DATABASE_SERVICE_URL}/api/telegram/bots/${userId}`, {
        headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
      });
      
      if (existingBotResponse.data?.botSettings) {
        // Бот существует, обновляем через PUT
        // Если токен не передан или равен 'keep', используем 'keep'
        const tokenToSend = botData.botToken || 'keep';
        
        botResponse = await axios.put(`${DATABASE_SERVICE_URL}/api/telegram/bots/${userId}`, {
          botToken: tokenToSend,
          isActive: botData.isActive || false,
          aiProvider: botData.aiProvider,
          contextEnabled: botData.contextEnabled,
          contextLimit: botData.contextLimit,
          companyName: botData.companyName,
          settings: {
            aiProvider: botData.aiProvider,
            contextEnabled: botData.contextEnabled,
            contextLimit: botData.contextLimit,
            companyName: botData.companyName,
            ...botData.settings
          }
        }, {
          headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
        });
      } else {
        isNewBot = true;
        throw new Error('Bot not found');
      }
    } catch (getError) {
      // Если бот не найден (404) или произошла другая ошибка, создаем новый
      if (getError.response?.status === 404 || getError.message === 'Bot not found') {
        // Для нового бота токен обязателен
        if (!botData.botToken || botData.botToken === 'keep') {
          return res.status(400).json({
            success: false,
            message: 'Для создания нового бота токен обязателен'
          });
        }
        
        botResponse = await axios.post(`${DATABASE_SERVICE_URL}/api/telegram/bots`, {
          userId,
          botToken: botData.botToken,
          isActive: botData.isActive || false,
          aiProvider: botData.aiProvider,
          contextEnabled: botData.contextEnabled,
          contextLimit: botData.contextLimit,
          companyName: botData.companyName,
          settings: {
            aiProvider: botData.aiProvider,
            contextEnabled: botData.contextEnabled,
            contextLimit: botData.contextLimit,
            companyName: botData.companyName,
            ...botData.settings
          }
        }, {
          headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
        });
      } else {
        throw getError;
      }
    }

    res.json(botResponse.data);
  } catch (error) {
    // Если есть ответ от database-service, логируем его
    if (error.response) {
      }
    
    res.status(500).json({
      success: false,
      message: 'Ошибка создания/сохранения настроек бота',
      error: error.message
    });
  }
});

// Обновить настройки бота
router.put('/', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const updateData = req.body;
    
              const updateResponse = await axios.put(`${DATABASE_SERVICE_URL}/api/telegram/bots/${userId}`, updateData, {
        headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
      });

    res.json(updateResponse.data);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка обновления настроек бота'
    });
  }
});

  // Удалить настройки бота
  router.delete('/', requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
      
      const deleteResponse = await axios.delete(`${DATABASE_SERVICE_URL}/api/telegram/bots/${userId}`, {
        headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
      });

      res.json(deleteResponse.data);
    } catch (error) {
      // Если есть ответ от database-service, логируем его
      if (error.response) {
        }
      
      res.status(500).json({
        success: false,
        message: 'Ошибка удаления настроек бота',
        error: error.message
      });
    }
  });

  // Переключить статус бота
  router.post('/toggle', requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
      const { isActive } = req.body;
      
      const updateResponse = await axios.patch(`${DATABASE_SERVICE_URL}/api/telegram/bots/${userId}/toggle`, {
        isActive
      }, {
        headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
      });

      res.json(updateResponse.data);
    } catch (error) {
      // Если есть ответ от database-service, логируем его
      if (error.response) {
        }
      
      res.status(500).json({
        success: false,
        message: 'Ошибка переключения статуса бота',
        error: error.message
      });
    }
  });

// Получить контекст бота
router.get('/context/all', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    
    const botResponse = await axios.get(`${DATABASE_SERVICE_URL}/api/telegram/bots/${userId}`, {
      headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
    });

    const botSettings = botResponse.data?.botSettings;
    
    res.json({
      success: true,
      contextEnabled: botSettings?.contextEnabled || false,
      contextLimit: botSettings?.contextLimit || 30,
      systemPrompt: botSettings?.systemPrompt || 'Multi-Chat Assistant'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка получения контекста бота'
    });
  }
});

  // Очистить контекст бота
  router.delete('/context/all', requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
      
      const clearResponse = await axios.delete(`${DATABASE_SERVICE_URL}/api/telegram/bots/${userId}/context`, {
        headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
      });

      res.json(clearResponse.data);
    } catch (error) {
      // Если есть ответ от database-service, логируем его
      if (error.response) {
        }
      
      res.status(500).json({
        success: false,
        message: 'Ошибка очистки контекста бота',
        error: error.message
      });
    }
  });

// Обновить название компании
router.put('/company-name', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const { companyName } = req.body;
    
    const updateResponse = await axios.put(`${DATABASE_SERVICE_URL}/api/telegram/bots/${userId}/company-name`, {
        companyName
      }, {
        headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
      });

    res.json(updateResponse.data);
  } catch (error) {
    // Если есть ответ от database-service, логируем его
    if (error.response) {
      }
    
    res.status(500).json({
      success: false,
      message: 'Ошибка обновления названия компании',
      error: error.message
    });
  }
});

module.exports = router;
