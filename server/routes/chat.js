const express = require('express');
const router = express.Router();
const axios = require('axios');
const { requireAuth } = require('../middleware/auth');

// Импортируем константы и функции из утилит
const utils = require('../utils');
const { 
  DATABASE_SERVICE_URL, 
  DATABASE_SERVICE_API_KEY,
  deductTokensForMultiChat
} = utils;

// Получить историю чата
router.get('/:provider/history', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const { provider } = req.params;
    
    const historyResponse = await axios.get(`${DATABASE_SERVICE_URL}/api/chat-history/${userId}/${provider}`, {
      headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
    });

    res.json(historyResponse.data);

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка получения истории чата'
    });
  }
});

// Очистить историю чата
router.delete('/:provider/history', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const { provider } = req.params;
    
    const deleteResponse = await axios.delete(`${DATABASE_SERVICE_URL}/api/chat-history/${userId}/${provider}`, {
      headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
    });

    res.json(deleteResponse.data);

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка очистки истории чата'
    });
  }
});

// Очистить всю историю чата
router.delete('/history', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    
    const deleteResponse = await axios.delete(`${DATABASE_SERVICE_URL}/api/chat-history/${userId}`, {
      headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
    });

    res.json(deleteResponse.data);

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка очистки всей истории чата'
    });
  }
});

// Добавить сообщение в чат
router.post('/:provider/message', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const { provider } = req.params;
    const { role, content } = req.body;
    
    if (!role || !content) {
      return res.status(400).json({
        success: false,
        message: 'Роль и содержание сообщения обязательны'
      });
    }

    const messageResponse = await axios.post(`${DATABASE_SERVICE_URL}/api/chat-history/${userId}/${provider}/message`, {
      role,
      content
    }, {
      headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
    });

    res.json(messageResponse.data);

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка добавления сообщения в чат'
    });
  }
});

// Мульти-чат с несколькими AI провайдерами
router.post('/multi-chat', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const { message, providers = ['openai', 'anthropic', 'google'] } = req.body;
    
    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Сообщение обязательно'
      });
    }

    if (!Array.isArray(providers) || providers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Список провайдеров должен быть непустым массивом'
      });
    }

    // Списываем токены за мульти-чат
    const tokenDeduction = await deductTokensForMultiChat(userId, providers, message);

    // Добавляем сообщение пользователя в историю для каждого провайдера
    const messagePromises = providers.map(provider => 
      axios.post(`${DATABASE_SERVICE_URL}/api/chat-history/${userId}/${provider}/message`, {
        role: 'user',
        content: message
      }, {
        headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
      })
    );

    await Promise.all(messagePromises);

    // Здесь должна быть логика для отправки сообщения всем AI провайдерам
    // и получения ответов от них
    // Пока возвращаем заглушку
    const responses = providers.map(provider => ({
      provider,
      response: `Ответ от ${provider} на сообщение: "${message}"`,
      timestamp: new Date().toISOString()
    }));

    // Добавляем ответы ассистентов в историю
    const assistantMessagePromises = responses.map(response => 
      axios.post(`${DATABASE_SERVICE_URL}/api/chat-history/${userId}/${response.provider}/message`, {
        role: 'assistant',
        content: response.response
      }, {
        headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
      })
    );

    await Promise.all(assistantMessagePromises);

    res.json({
      success: true,
      message: 'Мульти-чат выполнен успешно',
      responses: responses,
      tokenDeduction: tokenDeduction
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка мульти-чата'
    });
  }
});

// Получить статистику чата
router.get('/stats', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const { period = 'month' } = req.query;
    
    // Получаем историю чата для всех провайдеров
    const providers = ['openai', 'anthropic', 'google'];
    const statsPromises = providers.map(provider => 
      axios.get(`${DATABASE_SERVICE_URL}/api/chat-history/${userId}/${provider}`, {
        headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
      })
    );

    const statsResponses = await Promise.all(statsPromises);
    
    const stats = {
      totalMessages: 0,
      totalTokens: 0,
      providers: {},
      period: period
    };

    statsResponses.forEach((response, index) => {
      const provider = providers[index];
      const history = response.data.success ? response.data.messages : [];
      
      stats.providers[provider] = {
        messages: history.length,
        tokens: history.reduce((sum, msg) => sum + (msg.tokenCount || 0), 0)
      };
      
      stats.totalMessages += history.length;
      stats.totalTokens += stats.providers[provider].tokens;
    });

    res.json({
      success: true,
      stats: stats
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка получения статистики чата'
    });
  }
});

module.exports = router;
