const express = require('express');
const router = express.Router();
const { requireApiKey } = require('../middleware/auth');
const AISettings = require('../models/AISettings');
const ChatHistory = require('../models/ChatHistory');
const ProjectSettings = require('../models/ProjectSettings');
const axios = require('axios'); // Добавляем axios для интеграции с внешними сервисами

// Отправить сообщение конкретному AI провайдеру
router.post('/:provider', requireApiKey, async (req, res) => {
  try {
    const { provider } = req.params;
    const { message, systemPrompt } = req.body;
    
    if (!message) {
      return res.status(400).json({ 
        error: 'Bad Request',
        message: 'message обязателен' 
      });
    }

    const userId = req.headers['x-user-id'];
    
    if (!userId) {
      return res.status(400).json({ 
        error: 'Bad Request',
        message: 'x-user-id заголовок обязателен' 
      });
    }
    
    // Добавляем сообщение в историю чата
    const chatHistory = await ChatHistory.getOrCreate(userId, provider);
    // Добавляем сообщение пользователя
    await chatHistory.addMessage('user', message);
    
    // 🔍 ЗАГРУЖАЕМ КОНТЕКСТ ИЗ ИСТОРИИ ЧАТА
    const contextLimit = 10; // Лимит контекста для мультичата
    const chatContext = chatHistory.getContext(contextLimit);
    
    console.log('🔍 Multi-chat context loaded:', {
      contextLimit: contextLimit,
      contextMessages: chatContext.length,
      provider: provider
    });
    // Интеграция с реальными AI провайдерами
    let aiResponse = '';
    let success = true;
    
    try {
      // Определяем URL сервиса провайдера
      const providerUrls = {
        openai: process.env.OPENAI_SERVICE_URL,
        gemini: process.env.GEMINI_SERVICE_URL,
        anthropic: process.env.ANTHROPIC_SERVICE_URL,
        xai: process.env.XAI_SERVICE_URL,
        yandexgpt: process.env.YANDEXGPT_SERVICE_URL,
        gigachat: process.env.GIGACHAT_SERVICE_URL,
        deepseek: process.env.DEEPSEEK_SERVICE_URL
      };
      
      const providerUrl = providerUrls[provider];
      
      if (!providerUrl) {
        aiResponse = `Провайдер ${provider} не настроен. Отсутствует переменная окружения ${provider.toUpperCase()}_SERVICE_URL`;
        success = false;
      } else {
        // Получаем API ключ для провайдера из ProjectSettings
        const projectSettings = await ProjectSettings.getGlobalSettings();
        const apiKey = projectSettings.getApiKey(provider);
        
        if (!apiKey) {
          aiResponse = `API ключ для провайдера ${provider} не настроен`;
          success = false;
        } else {
          // Отправляем запрос к AI провайдеру
          const aiResponseData = await axios.post(`${providerUrl}/api/chat`, {
            message: message,
            systemPrompt: typeof systemPrompt === 'object' ? systemPrompt.prompt : (systemPrompt || 'Ты полезный ассистент. Отвечай на вопросы пользователя кратко и по делу.'),
            provider: provider,
            context: chatContext  // 🔍 ПЕРЕДАЕМ КОНТЕКСТ В AI ПРОВАЙДЕР
          }, {
            timeout: 30000,
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': apiKey
            }
          });
        
          if (aiResponseData.data?.success) {
            aiResponse = aiResponseData.data.content || aiResponseData.data.response || 'Ответ получен от AI провайдера';
          } else {
            aiResponse = `Ошибка от провайдера ${provider}: ${aiResponseData.data?.message || 'Неизвестная ошибка'}`;
            success = false;
          }
        }
      }
    } catch (aiError) {
      aiResponse = `Ошибка связи с провайдером ${provider}: ${aiError.message}`;
      success = false;
    }
    
    // Добавляем ответ AI в историю
    await chatHistory.addMessage('assistant', aiResponse);
     
     res.json({
       success: success,
       status: success ? 'success' : 'error',
       content: aiResponse,
       error: success ? null : aiResponse,
       context: chatContext,  // 🔍 ВОЗВРАЩАЕМ КОНТЕКСТ В ОТВЕТЕ
       contextInfo: {
         totalMessages: chatHistory.messages.length,
         contextUsed: chatContext.length,
         contextLimit: contextLimit
       }
     });
  } catch (error) {
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Ошибка отправки сообщения провайдеру' 
    });
  }
});

// Получить информацию о конкретном провайдере
router.get('/provider/:provider', requireApiKey, async (req, res) => {
  try {
    const { provider } = req.params;
    
    // Пока возвращаем заглушку
    res.json({
      success: true,
      provider: provider,
      enabled: true,
      config: {}
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Ошибка получения информации о провайдере' 
    });
  }
});

// Получить все провайдеры с детальной информацией
router.get('/all-providers', requireApiKey, async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    
    if (!userId) {
      return res.status(400).json({ 
        error: 'Bad Request',
        message: 'x-user-id заголовок обязателен' 
      });
    }

    // Получаем AI настройки пользователя
    const aiSettings = await AISettings.findByUserId(userId);
    
    if (!aiSettings || !aiSettings.activeProviders) {
      return res.status(404).json({ 
        error: 'Not Found',
        message: 'AI настройки не найдены для пользователя' 
      });
    }
    
    const providers = aiSettings.activeProviders.map(provider => ({
      name: provider,
      enabled: true,
      isDefault: provider === aiSettings.defaultProvider,
      config: {}
    }));
    
    res.json({
      success: true,
      providers: providers
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Ошибка получения всех провайдеров' 
    });
  }
});

// Получить список активных провайдеров для MultiChat
router.get('/providers', requireApiKey, async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    
    if (!userId) {
      return res.status(400).json({ 
        error: 'Bad Request',
        message: 'x-user-id заголовок обязателен' 
      });
    }
    
    // Получаем AI настройки пользователя
    const aiSettings = await AISettings.findByUserId(userId);
    if (!aiSettings || !aiSettings.activeProviders) {
      return res.status(404).json({ 
        error: 'Not Found',
        message: 'AI настройки не найдены для пользователя' 
      });
    }
    
    res.json({
      success: true,
      activeProviders: aiSettings.activeProviders
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Ошибка получения провайдеров' 
    });
  }
});

// Получить историю мульти-чата
router.get('/history', requireApiKey, async (req, res) => {
  try {
    const { page = 1, limit = 20, provider = null } = req.query;
    
    const userId = req.headers['x-user-id'];
    
    if (!userId) {
      return res.status(400).json({ 
        error: 'Bad Request',
        message: 'x-user-id заголовок обязателен' 
      });
    }

    // Пока возвращаем заглушку
    res.json({
      success: true,
      messages: [],
      total: 0,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Ошибка получения истории мульти-чата' 
    });
  }
});

// Получить историю чата для конкретного провайдера
router.get('/history/:provider', requireApiKey, async (req, res) => {
  try {
    const { provider } = req.params;
    
    const userId = req.headers['x-user-id'];
    
    if (!userId) {
      return res.status(400).json({ 
        error: 'Bad Request',
        message: 'x-user-id заголовок обязателен' 
      });
    }
    
    const chatHistory = await ChatHistory.getOrCreate(userId, provider);
    
    res.json({
      success: true,
      messages: chatHistory.messages || []
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Ошибка получения истории чата' 
    });
  }
});

// Очистить всю историю мульти-чата для пользователя
router.delete('/history', requireApiKey, async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    
    if (!userId) {
      return res.status(400).json({ 
        error: 'Bad Request',
        message: 'x-user-id заголовок обязателен' 
      });
    }
    
    // Находим все истории чата для пользователя
    const allChatHistories = await ChatHistory.find({ userId });
    
    if (allChatHistories.length > 0) {
      // Очищаем каждую историю
      for (const chatHistory of allChatHistories) {
        await chatHistory.clearHistory();
      }
      
      res.json({
        success: true,
        message: `Очищено ${allChatHistories.length} историй чата`,
        clearedCount: allChatHistories.length
      });
    } else {
      res.json({
        success: true,
        message: 'Истории чата не найдены',
        clearedCount: 0
      });
    }
  } catch (error) {
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Ошибка очистки истории чата' 
    });
  }
});

// Очистить историю чата для конкретного провайдера
router.delete('/history/:provider', requireApiKey, async (req, res) => {
  try {
    const { provider } = req.params;
    
    const userId = req.headers['x-user-id'];
    
    if (!userId) {
      return res.status(400).json({ 
        error: 'Bad Request',
        message: 'x-user-id заголовок обязателен' 
      });
    }
    
    const chatHistory = await ChatHistory.findOne({ userId, provider });
    
    if (chatHistory) {
      await chatHistory.clearHistory();
    }
    
    res.json({
      success: true,
      message: 'История чата очищена'
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Ошибка очистки истории чата' 
    });
  }
});

module.exports = router;
