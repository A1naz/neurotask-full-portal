const express = require('express');
const router = express.Router();
const { requireApiKey } = require('../middleware/auth');
const TelegramBot = require('../models/TelegramBot');
const mongoose = require('mongoose');
const crypto = require('crypto');

// Получаем ключ шифрования из переменных окружения
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-super-secret-encryption-key-2024';

// Функции для шифрования/дешифрования токенов
function encryptToken(value) {
  if (!value || value === 'keep') return value; // Не шифруем 'keep'
  
  try {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipher(algorithm, key);
    let encrypted = cipher.update(value, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    return value;
  }
}

function decryptToken(value) {
  if (!value || value === 'keep') return value; // Не расшифровываем 'keep'
  
  try {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
    
    const parts = value.split(':');
    
    if (parts.length !== 2) {
      // Если токен не зашифрован, возвращаем как есть
      return value;
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    
    const decipher = crypto.createDecipher(algorithm, key);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    // Если не удалось расшифровать, возвращаем как есть
    return value;
  }
}

// ===== TELEGRAM BOT MANAGEMENT ENDPOINTS =====

// Получить всех ботов
router.get('/', requireApiKey, async (req, res) => {
  try {
    const bots = await TelegramBot.find({})
      .populate('userId', 'username email firstName lastName')
      .sort({ createdAt: -1 });

    // Возвращаем ботов с userId как ObjectId (без преобразований)
    res.json({
      success: true,
      bots: bots
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Ошибка получения ботов'
    });
  }
});

// Создать/сохранить бота
router.post('/', requireApiKey, async (req, res) => {
  try {
    const { userId, botToken, botUsername, isActive = false, settings = {}, ...otherFields } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'userId обязателен'
      });
    }
    
    // Проверяем botToken только если это новый бот
    // Если botUsername не передан, генерируем его из токена или используем дефолтное значение
    const username = botUsername || `bot_${userId}`;
    
    // Подготавливаем настройки, объединяя settings с другими полями
    const botSettings = {
      ...settings,
      aiProvider: otherFields.aiProvider || settings.aiProvider || 'openai',
      contextEnabled: otherFields.contextEnabled !== undefined ? otherFields.contextEnabled : (settings.contextEnabled !== undefined ? settings.contextEnabled : true),
      contextLimit: otherFields.contextLimit || settings.contextLimit || 30,
      companyName: otherFields.companyName || settings.companyName || 'Neurotask'
    };
    
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Неверный ID пользователя'
      });
    }

    // Проверяем, существует ли уже бот для этого пользователя
    let bot = await TelegramBot.findOne({ userId });
    let isNewBot = false;
    
    if (bot) {
      // Бот существует - можно использовать 'keep'
    } else {
      // Бот не существует - токен обязателен
      if (!botToken) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'botToken обязателен для создания нового бота'
        });
      }
    }
    
    if (bot) {
      // Обновляем существующего бота
      // Обновляем токен только если он не равен 'keep'
      if (botToken !== 'keep') {
        bot.botToken = encryptToken(botToken); // Шифруем токен перед сохранением
        bot.botUsername = username;
        console.log('🔍 Bot token updated:', botToken ? '***' + botToken.slice(-4) : 'НЕ ПЕРЕДАН');
      } else {
        console.log('🔍 Bot token not updated (keep)');
      }
      
      // ВСЕГДА обновляем остальные поля, независимо от токена
      bot.isActive = isActive;
      bot.updatedAt = new Date();
      
      if (isActive && !bot.activatedAt) {
        bot.activatedAt = new Date();
      }
      
      // Обновляем настройки на верхнем уровне
      const updateFields = {
        isActive: bot.isActive,
        updatedAt: bot.updatedAt,
        activatedAt: bot.activatedAt,
        aiProvider: botSettings.aiProvider,
        contextEnabled: botSettings.contextEnabled,
        contextLimit: botSettings.contextLimit,
        companyName: botSettings.companyName
      };
      
      // Обновляем botUsername, если он передан
      if (botUsername) {
        updateFields.botUsername = botUsername;
      }
      
      // Используем findOneAndUpdate для правильного обновления вложенных полей
      const updatedBot = await TelegramBot.findOneAndUpdate(
        { userId },
        { $set: updateFields },
        { new: true, runValidators: true }
      );
      
      if (updatedBot) {
        bot = updatedBot;
      }
      
    } else {
      // Создаем нового бота
      isNewBot = true;
      bot = new TelegramBot({
        userId,
        botToken: encryptToken(botToken), // Шифруем токен при создании
        botUsername: username,
        isActive,
        aiProvider: botSettings.aiProvider,
        contextEnabled: botSettings.contextEnabled,
        contextLimit: botSettings.contextLimit,
        companyName: botSettings.companyName,
        messageCount: 0,
        lastActivity: null,
        activatedAt: isActive ? new Date() : null,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      await bot.save();
    }

    // Подготавливаем ответ без токена для безопасности
    const botForResponse = {
      ...bot.toObject(),
      botToken: null // Не показываем токен в ответе
    };
    
    res.json({
      success: true,
      message: isNewBot ? 'Бот создан' : 'Бот обновлен',
      botSettings: botForResponse
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Ошибка создания/обновления бота'
    });
  }
});

// Получить бота пользователя по ID пользователя
router.get('/:userId', requireApiKey, async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Неверный ID пользователя'
      });
    }

    const bot = await TelegramBot.findOne({ userId })
      .populate('userId', 'username email firstName lastName');

    if (!bot) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Бот не найден'
      });
    }

    // Подготавливаем ответ без токена для безопасности
    const botForResponse = {
      ...bot.toObject(),
      botToken: null // Не показываем токен в ответе
    };
    
    res.json({
      success: true,
      botSettings: botForResponse
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Ошибка получения бота'
    });
  }
});

// Получить бота пользователя по ID пользователя (с токеном для telegram-bot-service)
router.get('/:userId/token', requireApiKey, async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Неверный ID пользователя'
      });
    }

    const bot = await TelegramBot.findOne({ userId })
      .populate('userId', 'username email firstName lastName');

    if (!bot) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Бот не найден'
      });
    }

    // Возвращаем зашифрованный токен для telegram-bot-service
    const botForResponse = {
      ...bot.toObject(),
      botToken: bot.botToken, // Возвращаем зашифрованный токен
      companyName: bot.companyName
    };
    
    console.log('🔍 Bot token:', bot.botToken ? '***' + bot.botToken.slice(-4) + '...' : 'null');
    console.log('🔍 Company name:', bot.companyName || 'null');
    
    res.json({
      success: true,
      botSettings: botForResponse
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Ошибка получения токена бота'
    });
  }
});

// Обновить бота
router.put('/:userId', requireApiKey, async (req, res) => {
  try {
    const { userId } = req.params;
    const updateData = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Неверный ID пользователя'
      });
    }

    // Подготавливаем данные для обновления
    const updateFields = { updatedAt: new Date() };
    
    // Обновляем основные поля, если они переданы
    if (updateData.botToken !== undefined && updateData.botToken !== 'keep') {
      updateFields.botToken = encryptToken(updateData.botToken); // Шифруем токен перед сохранением
      console.log('🔍 Bot token updated:', updateData.botToken ? '***' + updateData.botToken.slice(-4) : 'НЕ ПЕРЕДАН');
    } else if (updateData.botToken === 'keep') {
      console.log('🔍 Bot token not updated (keep)');
    }
    if (updateData.isActive !== undefined) {
      updateFields.isActive = updateData.isActive;
    }
    
    // Сначала обрабатываем поля, которые должны быть на верхнем уровне
    // Эти поля должны обновляться на верхнем уровне, а не в settings
    if (updateData.aiProvider !== undefined) {
      updateFields.aiProvider = updateData.aiProvider;
    }
    if (updateData.contextEnabled !== undefined) {
      updateFields.contextEnabled = updateData.contextEnabled;
    }
    if (updateData.contextLimit !== undefined) {
      updateFields.contextLimit = updateData.contextLimit;
    }
    if (updateData.companyName !== undefined) {
      updateFields.companyName = updateData.companyName;
    }
    
    // Убираем обработку settings - все поля обновляются на верхнем уровне
    
    // Используем $set для правильного обновления вложенных полей
    const updateQuery = { $set: updateFields };
    
    console.log('🔍 Updating bot with fields:', Object.keys(updateFields));
    
    const bot = await TelegramBot.findOneAndUpdate(
      { userId },
      updateQuery,
      { new: true, runValidators: true }
    ).populate('userId', 'username email firstName lastName');

    if (!bot) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Бот не найден'
      });
    }

    // Подготавливаем ответ без токена для безопасности
    const botForResponse = {
      ...bot.toObject(),
      botToken: null // Не показываем токен в ответе
    };
    
    res.json({
      success: true,
      message: 'Бот обновлен',
      botSettings: botForResponse
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Ошибка обновления бота'
    });
  }
});

// Удалить бота
router.delete('/:userId', requireApiKey, async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Неверный ID пользователя'
      });
    }

    const bot = await TelegramBot.findOneAndDelete({ userId });
    
    if (!bot) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Бот не найден'
      });
    }

    res.json({
      success: true,
      message: 'Бот удален'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Ошибка удаления бота'
    });
  }
});

// Получить статистику бота
router.get('/:userId/stats', requireApiKey, async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Неверный ID пользователя'
      });
    }

    const bot = await TelegramBot.findOne({ userId }).populate('userId', 'username email firstName lastName');
    
    if (!bot) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Бот не найден'
      });
    }

    const now = new Date();
    const activated = bot.activatedAt ? new Date(bot.activatedAt) : null;
    const uptime = activated ? now - activated : 0;

    const stats = {
      isActive: bot.isActive || false,
      messageCount: bot.messageCount || 0,
      uptime: uptime,
      lastActivity: bot.lastActivity || null,
      activatedAt: bot.activatedAt || null,
      createdAt: bot.createdAt,
      updatedAt: bot.updatedAt
    };

    res.json({
      success: true,
      stats: stats
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Ошибка получения статистики бота'
    });
  }
});

// Записать активность бота (messageCount теперь берется из реальной истории чата)
router.post('/:userId/activity', requireApiKey, async (req, res) => {
  try {
    const { userId } = req.params;
    const { messageCount, lastActivity } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Неверный ID пользователя'
      });
    }

    const updateData = { updatedAt: new Date() };
    if (messageCount !== undefined) {
      updateData.messageCount = messageCount;
      console.log('🔍 Message count updated:', messageCount, typeof messageCount === 'number' ? 'valid integer' : 'not valid integer');
    }
    if (lastActivity !== undefined) {
      updateData.lastActivity = new Date(lastActivity);
      console.log('🔍 Last activity updated:', lastActivity);
    }
    
    const bot = await TelegramBot.findOneAndUpdate(
      { userId },
      updateData,
      { new: true, runValidators: true }
    ).populate('userId', 'username email firstName lastName');

    if (!bot) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Бот не найден'
      });
    }

    res.json({
      success: true,
      message: 'Активность бота обновлена',
      botSettings: bot
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Ошибка обновления активности бота'
    });
  }
});

// Получить промпт бота
router.get('/:userId/prompt', requireApiKey, async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Неверный ID пользователя'
      });
    }

    const bot = await TelegramBot.findOne({ userId }).populate('userId', 'username email firstName lastName');
    
    if (!bot) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Бот не найден'
      });
    }

    res.json({
      success: true,
      prompt: bot.settings?.systemPrompt || 'Ты полезный AI-ассистент. Отвечай на вопросы пользователя кратко и по делу.'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Ошибка получения промпта бота'
    });
  }
});

// Обновить промпт бота
router.put('/:userId/prompt', requireApiKey, async (req, res) => {
  try {
    const { userId } = req.params;
    const { systemPrompt } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'systemPrompt обязателен'
      });
    }

    if (!systemPrompt) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'systemPrompt обязателен'
      });
    }

    const bot = await TelegramBot.findOneAndUpdate(
      { userId },
      { 
        'settings.systemPrompt': systemPrompt,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    ).populate('userId', 'username email firstName lastName');

    if (!bot) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Бот не найден'
      });
    }

    res.json({
      success: true,
      message: 'Промпт бота обновлен',
      botSettings: bot
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Ошибка обновления промпта бота'
    });
  }
});

// Переключить бота
router.patch('/:userId/toggle', requireApiKey, async (req, res) => {
  try {
    const { userId } = req.params;
    const { isActive } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'isActive должен быть boolean'
      });
    }

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'isActive должен быть boolean'
      });
    }

    const updateData = { 
      isActive,
      updatedAt: new Date()
    };

    if (isActive) {
      updateData.activatedAt = new Date();
    }

    const bot = await TelegramBot.findOneAndUpdate(
      { userId },
      updateData,
      { new: true, runValidators: true }
    ).populate('userId', 'username email firstName lastName');

    if (!bot) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Бот не найден'
      });
    }

    res.json({
      success: true,
      message: `Bot ${isActive ? 'activated' : 'deactivated'}`,
      botSettings: bot
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Ошибка переключения бота'
    });
  }
});

// Очистить контекст бота
router.delete('/:userId/context', requireApiKey, async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Неверный ID пользователя'
      });
    }

    console.log('🔍 Clearing bot context for user:', userId);

    const bot = await TelegramBot.findOneAndUpdate(
      { userId },
      { 
        'settings.context': [],
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    ).populate('userId', 'username email firstName lastName');

    if (!bot) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Бот не найден'
      });
    }

    res.json({
      success: true,
      message: 'Контекст бота очищен',
      botSettings: bot
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Ошибка очистки контекста бота'
    });
  }
});

// Обновить название компании в промпте бота
router.put('/:userId/company-name', requireApiKey, async (req, res) => {
  try {
    const { userId } = req.params;
    const { companyName } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'companyName обязателен'
      });
    }

    if (!companyName) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'companyName обязателен'
      });
    }

    const bot = await TelegramBot.findOne({ userId });
    
    if (!bot) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Бот не найден'
      });
    }

    // Обновляем название компании на верхнем уровне
    bot.companyName = companyName;
    bot.updatedAt = new Date();

    await bot.save();

    res.json({
      success: true,
      message: 'Название компании обновлено',
      botSettings: bot
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Ошибка обновления названия компании'
    });
  }
});

// Обновить бота по Bot ID (для совместимости с telegram-bot-service)
router.put('/bot/:botId', requireApiKey, async (req, res) => {
  try {
    const { botId } = req.params;
    const updateData = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(botId)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Неверный ID бота'
      });
    }

    const bot = await TelegramBot.findByIdAndUpdate(
      botId,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).populate('userId', 'username email firstName lastName');

    if (!bot) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Бот не найден'
      });
    }

    res.json({
      success: true,
      message: 'Бот обновлен',
      botSettings: bot
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Ошибка обновления бота'
    });
  }
});

// Обновить бота по Bot ID (старый URL для совместимости)
router.put('/id/:botId', requireApiKey, async (req, res) => {
  try {
    const { botId } = req.params;
    const updateData = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(botId)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Неверный ID бота'
      });
    }

    const bot = await TelegramBot.findByIdAndUpdate(
      botId,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).populate('userId', 'username email firstName lastName');

    if (!bot) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Бот не найден'
      });
    }

    console.log('🔍 Bot updated by ID:', botId);

    res.json({
      success: true,
      message: 'Бот обновлен',
      botSettings: bot
    });
  } catch (error) {
    console.log('🔍 Error updating bot by ID:', error.message);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Ошибка обновления бота'
    });
  }
});

module.exports = router;
