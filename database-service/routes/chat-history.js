const express = require('express');
const router = express.Router();
const { requireApiKey } = require('../middleware/auth');
const ChatHistory = require('../models/ChatHistory');
const BotChatHistory = require('../models/BotChatHistory');
const mongoose = require('mongoose');

// ===== CHAT HISTORY ENDPOINTS =====

// Получить историю чата пользователя с провайдером
router.get('/:userId/:provider', requireApiKey, async (req, res) => {
  try {
    const { userId, provider } = req.params;
    const { page = 1, limit = 50 } = req.query;
    
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Неверный ID пользователя'
      });
    }

    const chatHistory = await ChatHistory.findOne({ userId, provider });
    
    if (!chatHistory) {
      return res.json({
        success: true,
        messages: [],
        totalPages: 0,
        currentPage: page,
        total: 0
      });
    }

    const messages = chatHistory.messages
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice((page - 1) * limit, page * limit);

    const total = chatHistory.messages.length;

    res.json({
      success: true,
      messages,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Ошибка получения истории чата'
    });
  }
});

// Удалить историю чата пользователя с провайдером
router.delete('/:userId/:provider', requireApiKey, async (req, res) => {
  try {
    const { userId, provider } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Неверный ID пользователя'
      });
    }

    const result = await ChatHistory.updateOne(
      { userId, provider },
      { $set: { messages: [] } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'История чата не найдена'
      });
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

// Удалить всю историю чата пользователя
router.delete('/:userId', requireApiKey, async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Неверный ID пользователя'
      });
    }

    const result = await ChatHistory.updateMany(
      { userId },
      { $set: { messages: [] } }
    );

    res.json({
      success: true,
      message: 'Вся история чата очищена',
      clearedChats: result.modifiedCount
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Ошибка очистки всей истории чата'
    });
  }
});

// Добавить сообщение в историю чата
router.post('/:userId/:provider/message', requireApiKey, async (req, res) => {
  try {
    const { userId, provider } = req.params;
    const { role, content, timestamp = Date.now() } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Неверный ID пользователя'
      });
    }

    if (!role || !content) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'role и content обязательны'
      });
    }

    if (!['user', 'assistant'].includes(role)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'role должен быть user или assistant'
      });
    }

    let chatHistory = await ChatHistory.findOne({ userId, provider });
    
    if (!chatHistory) {
      chatHistory = new ChatHistory({
        userId,
        provider,
        messages: []
      });
    }

    const message = {
      role,
      content,
      timestamp: new Date(timestamp)
    };

    chatHistory.messages.push(message);
    chatHistory.updatedAt = new Date();
    await chatHistory.save();

    res.status(201).json({
      success: true,
      message: 'Сообщение добавлено в историю чата',
      message: message
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Ошибка добавления сообщения в историю чата'
    });
  }
});

// ===== BOT CHAT HISTORY ENDPOINTS =====

// Получить общее количество сообщений бота из всех чатов
router.get('/bot-chat-history/:botId/total-count', requireApiKey, async (req, res) => {
  try {
    const { botId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(botId)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Неверный ID бота'
      });
    }

    // Сначала получаем все документы истории для этого бота
    const allHistories = await BotChatHistory.find({ botId });
    console.log('🔍 Found bot chat histories:', allHistories.length);
    
    // Подсчитываем общее количество сообщений
    const totalCount = allHistories.reduce((sum, hist) => sum + hist.messages.length, 0);
    
    allHistories.forEach(hist => {
      console.log('🔍 Chat history:', hist.chatId, 'messages:', hist.messages.length);
    });
    
    res.json({
      success: true,
      totalCount: totalCount
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Ошибка получения общего количества сообщений бота'
    });
  }
});

// Получить историю чата бота
router.get('/bot-chat-history/:botId/:chatId', requireApiKey, async (req, res) => {
  try {
    const { botId, chatId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    
    if (!mongoose.Types.ObjectId.isValid(botId)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Неверный ID бота'
      });
    }

    const chatHistory = await BotChatHistory.findOne({ botId, chatId });
    
    if (!chatHistory) {
      return res.json({
        success: true,
        messages: [],
        totalPages: 0,
        currentPage: page,
        total: 0
      });
    }

    const messages = chatHistory.messages
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice((page - 1) * limit, page * limit);

    const total = chatHistory.messages.length;
    
    console.log('🔍 First message preview:', messages.length > 0 ? messages[0].content.substring(0, 50) + '...' : 'none');

    res.json({
      success: true,
      messages,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Ошибка получения истории чата бота'
    });
  }
});

// Добавить сообщение в историю чата бота
router.post('/bot-chat-history/:botId/:chatId/message', requireApiKey, async (req, res) => {
  try {
    const { botId, chatId } = req.params;
    const { role, content, timestamp = Date.now() } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(botId)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Неверный ID бота'
      });
    }

    if (!role || !content) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'role и content обязательны'
      });
    }

    if (!['user', 'assistant', 'system'].includes(role)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'role должен быть user, assistant или system'
      });
    }

    let chatHistory = await BotChatHistory.findOne({ botId, chatId });
    
    if (!chatHistory) {
      chatHistory = new BotChatHistory({
        botId,
        chatId,
        messages: []
      });
    }

    const message = {
      role,
      content,
      timestamp: new Date(timestamp)
    };

    chatHistory.messages.push(message);
    chatHistory.updatedAt = new Date();
    await chatHistory.save();

    console.log('🔍 Message added, total messages:', chatHistory.messages.length);

    res.status(201).json({
      success: true,
      message: 'Сообщение добавлено в историю чата бота',
      message: message
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Ошибка добавления сообщения в историю чата бота'
    });
  }
});

// Удалить историю чата бота
router.delete('/bot-chat-history/:botId/:chatId', requireApiKey, async (req, res) => {
  try {
    const { botId, chatId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(botId)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Неверный ID бота'
      });
    }

    const result = await BotChatHistory.deleteOne({ botId, chatId });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'История чата бота не найдена'
      });
    }

    res.json({
      success: true,
      message: 'История чата бота удалена'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Ошибка удаления истории чата бота'
    });
  }
});

// Удалить всю историю чата бота
router.delete('/bot-chat-history/:botId', requireApiKey, async (req, res) => {
  try {
    const { botId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(botId)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Неверный ID бота'
      });
    }

    const result = await BotChatHistory.deleteMany({ botId });

    res.json({
      success: true,
      message: 'Вся история чата бота удалена',
      deletedChats: result.deletedCount
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Ошибка удаления всей истории чата бота'
    });
  }
});

module.exports = router;
