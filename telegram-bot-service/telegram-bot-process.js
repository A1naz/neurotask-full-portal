const TelegramBot = require('node-telegram-bot-api');
const { google } = require('googleapis');
const AIGatewayClient = require('./services/aiGatewayClient');
const crypto = require('crypto');
const { BALANCE_SERVICE_URL, BALANCE_SERVICE_API_KEY } = require('./utils');
require('dotenv').config();

// Функции для расшифровки токена
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-super-secret-encryption-key-2024';

function decryptToken(encryptedToken) {
  try {
    if (!encryptedToken || typeof encryptedToken !== 'string') {
      return encryptedToken;
    }
    
    // Проверяем, зашифрован ли токен (формат: iv:encrypted)
    if (!encryptedToken.includes(':')) {
      console.log('🔍 Token not encrypted, using as-is');
      return encryptedToken;
    }
    
    const parts = encryptedToken.split(':');
    if (parts.length !== 2) {
      return encryptedToken;
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    
    // Используем тот же ключ, что и в database-service
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
    const decipher = crypto.createDecipher('aes-256-cbc', key);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    return encryptedToken;
  }
}

// Database Service Client
const axios = require('axios');

class DatabaseServiceClient {
  constructor() {
    this.baseURL = process.env.DATABASE_SERVICE_URL || 'http://localhost:3012';
    this.apiKey = process.env.DATABASE_SERVICE_API_KEY || 'your-database-service-api-key-here';
    
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey
      }
    });
  }

  async getTelegramBots() {
    try {
      const response = await this.client.get('/api/telegram/bots');
      let bots = [];
      
      // Проверяем разные возможные структуры ответа
      if (response.data.bots) {
        bots = response.data.bots;
      } else if (response.data.botSettings) {
        // Если возвращается один бот, оборачиваем в массив
        bots = Array.isArray(response.data.botSettings) ? response.data.botSettings : [response.data.botSettings];
      } else if (Array.isArray(response.data)) {
        bots = response.data;
      } else {
        return [];
      }
      
      // Для каждого бота получаем токен через специальный эндпоинт
      const botsWithTokens = [];
      for (const bot of bots) {
        try {
          if (bot.userId) {
            // userId теперь приходит как ObjectId, используем напрямую
            const userId = bot.userId;
            const tokenResponse = await this.client.get(`/api/telegram/bots/${userId}/token`);
            if (tokenResponse.data.success && tokenResponse.data.botSettings) {
              const botWithToken = tokenResponse.data.botSettings;
              botsWithTokens.push(botWithToken);
            }
          } else {
            }
        } catch (tokenError) {
          // Добавляем бота без токена
          botsWithTokens.push(bot);
        }
      }
      
      return botsWithTokens;
    } catch (error) {
      return [];
    }
  }

  async getSystemPrompt(userId) {
    try {
      // Получаем настройки бота через специальный эндпоинт для токена
      const response = await this.client.get(`/api/telegram/bots/${userId}/token`);
      
      if (response.data.success && response.data.botSettings) {
        const botSettings = response.data.botSettings;
        
        // Проверяем наличие системного промпта
        if (botSettings.prompts && botSettings.prompts.system) {
          let systemPrompt = botSettings.prompts.system;
          
          // Заменяем плейсхолдер {company_name} на реальное название компании
          if (botSettings.companyName) {
            systemPrompt = systemPrompt.replace(/{company_name}/g, botSettings.companyName);
          }
          
          return systemPrompt;
        }
        
        // Системный промпт должен быть всегда, если его нет - это ошибка
        throw new Error('System prompt not found in bot settings');
      }
      
      throw new Error('Failed to get bot settings');
    } catch (error) {
      throw error;
    }
  }

  async getAISettings(userId) {
    try {
      // Сначала пытаемся получить настройки из AI Settings
      try {
        const response = await this.client.get(`/api/settings/ai/${userId}`);
        if (response.data.settings) {
          return response.data.settings;
        }
      } catch (aiError) {
        console.log('🔍 AI Settings not available, using bot settings:', aiError.message);
      }
      
      // Если AI Settings недоступны, используем настройки бота
      try {
        // userId теперь приходит как ObjectId, используем напрямую
        const botResponse = await this.client.get(`/api/telegram/bots/${userId}/token`);
        if (botResponse.data.success && botResponse.data.botSettings) {
          const botSettings = botResponse.data.botSettings;
          // Формируем AI настройки из настроек бота
          return {
            defaultProvider: botSettings.aiProvider || 'openai',
            allowedProviders: ['openai', 'gemini', 'anthropic'],
            maxTokens: 1000,
            temperature: 0.7
          };
        }
      } catch (botError) {
        console.log('🔍 Bot settings not available, using defaults:', botError.message);
      }
      
      // Возвращаем дефолтные настройки
      return {
        defaultProvider: 'openai',
        allowedProviders: ['openai', 'gemini', 'anthropic'],
        maxTokens: 1000,
        temperature: 0.7
      };
    } catch (error) {
      return {
        defaultProvider: 'openai',
        allowedProviders: ['openai', 'gemini', 'anthropic'],
        maxTokens: 1000,
        temperature: 0.7
      };
    }
  }

  async updateUserBalance(userId, amount, type, description, metadata) {
    try {
      // Проверяем валидность userId
      if (!userId) {
        throw new Error('userId is required');
      }
      
      // userId приходит как ObjectId, конвертируем в строку для URL (как в мультичате)
      const userIdStr = userId.toString();
      console.log('🔍 Updating user balance for userId:', userIdStr);
      
      // Используем balance-service для списания токенов (как в мультичате)
      console.log('🔍 Balance service URL:', BALANCE_SERVICE_URL || 'undefined');
      
      // Определяем endpoint в зависимости от типа операции (используем строку как в мультичате)
      const endpoint = type === 'deduct' || type === 'spend' ? `/api/balance/${userIdStr}/deduct` : `/api/balance/${userIdStr}/add`;
      const requestData = {
        amount,
        description,
        metadata,
        userId: userIdStr // Передаем userId как строку (как в мультичате)
      };
      const response = await axios.post(`${BALANCE_SERVICE_URL}${endpoint}`, requestData, {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': BALANCE_SERVICE_API_KEY
        },
        timeout: 10000
      });
      
      return response.data;
    } catch (error) {
      if (error.response) {
        } else if (error.request) {
        } else {
        }
      throw error;
    }
  }

  // Добавляем метод для обновления активности бота
  async updateBotActivity(userId, currentMessageCount = 0) {
    try {
      // userId теперь приходит как ObjectId, используем напрямую
      // Используем реальное количество сообщений из истории чата (без увеличения)
      const requestBody = {
        messageCount: currentMessageCount,
        lastActivity: new Date()
      };
      const endpoint = `/api/telegram/bots/${userId}/activity`;
      const response = await this.client.post(endpoint, requestBody);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Получить историю чата бота
  async getBotChatHistory(botId, chatId) {
    try {
      // botId теперь приходит как ObjectId, используем напрямую
      const endpoint = `/api/chat-history/bot-chat-history/${botId}/${chatId}`;
      const response = await this.client.get(endpoint);
      console.log('🔍 Bot chat history endpoint:', endpoint || 'undefined');
      
      if (response.data.messages && Array.isArray(response.data.messages)) {
        response.data.messages.slice(0, 3).forEach((msg, index) => {
          console.log(`🔍 Message ${index}:`, msg.role, msg.content.substring(0, 100) + '...');
        });
      }
      
      return response.data;
    } catch (error) {
      return { success: false, messages: [], systemPrompt: '' };
    }
  }

  // Добавить сообщение в историю чата бота
  async addBotChatMessage(botId, chatId, role, content) {
    try {
      // botId теперь приходит как ObjectId, используем напрямую
      console.log('🔍 Adding bot chat message:', role, content.substring(0, 100) + '...');
      
      const response = await this.client.post(`/api/chat-history/bot-chat-history/${botId}/${chatId}/message`, {
        role,
        content
      });
      return response.data;
    } catch (error) {
      return { success: false };
    }
  }

  // Очистить историю чата бота
  async clearBotChatHistory(botId, chatId) {
    try {
      // botId теперь приходит как ObjectId, используем напрямую
      const response = await this.client.delete(`/api/chat-history/bot-chat-history/${botId}/${chatId}`);
      return response.data;
    } catch (error) {
      return { success: false };
    }
  }

  // Обновить настройки Telegram бота
  async updateTelegramBot(botId, updates) {
    try {
      const response = await this.client.put(`/api/telegram/bots/id/${botId}`, updates);
      return response.data;
    } catch (error) {
      return { success: false };
    }
  }

  // Получить общее количество сообщений бота из всех чатов
  async getBotTotalMessageCount(botId) {
    try {
      const endpoint = `/api/chat-history/bot-chat-history/${botId}/total-count`;
      const response = await this.client.get(endpoint);
      const totalCount = response.data.totalCount || 0;
      return totalCount;
    } catch (error) {
      return 0;
    }
  }

  // Получить все Telegram боты
  async getTelegramBots() {
    try {
      const response = await this.client.get('/api/telegram/bots');
      return response.data.bots || [];
    } catch (error) {
      return [];
    }
  }
}

class TelegramBotProcess {
  constructor() {
    this.bots = new Map(); // Хранит активные экземпляры ботов
    this.aiGatewayClient = new AIGatewayClient();
    this.databaseClient = new DatabaseServiceClient();
  }

  // Отправка запроса к AI через Gateway
  async sendToAI(provider, systemPrompt, userMessage, context = []) {
    try {
      // Детальное логирование контекста
      if (context && context.length > 0) {
        context.forEach((msg, index) => {
          console.log(`🔍 Context message ${index}:`, msg.role, msg.content.substring(0, 100) + '...');
        });
      } else {
        console.log('🔍 No context provided');
      }
      
      const options = {
        systemPrompt,
        context,
        maxTokens: 1000,
        temperature: 0.7
      };

      console.log('🔍 AI Gateway request options:', {
        maxTokens: options.maxTokens,
        temperature: options.temperature
      });
      
      // Детальное логирование контекста для AI Gateway
      if (context && context.length > 0) {
        context.forEach((msg, index) => {
          console.log(`🔍 AI Gateway context message ${index}:`, msg.role, msg.content.substring(0, 100) + '...');
        });
      }

      const response = await this.aiGatewayClient.processAIRequest(
        'telegram-bot', // userId для бота
        provider,
        userMessage,
        options
      );

      if (response.success) {
        return response.content;
      } else {
        throw new Error(`AI Gateway error: ${response.error}`);
      }
    } catch (error) {
      throw error;
    }
  }

  // Работа с Google Calendar
  async createGoogleCalendarClient(botSettings) {
    try {
      const oauth2Client = new google.auth.OAuth2(
        botSettings.googleCalendarSettings.clientId,
        botSettings.googleCalendarSettings.clientSecret
      );

      oauth2Client.setCredentials({
        refresh_token: botSettings.googleCalendarSettings.refreshToken,
        access_token: botSettings.googleCalendarSettings.accessToken
      });

      return google.calendar({ version: 'v3', auth: oauth2Client });
    } catch (error) {
      throw error;
    }
  }

  // Создание события в календаре
  async createCalendarEvent(calendarClient, eventData) {
    try {
      const event = {
        summary: eventData.summary,
        description: eventData.description,
        start: {
          dateTime: eventData.startTime,
          timeZone: 'Europe/Moscow'
        },
        end: {
          dateTime: eventData.endTime,
          timeZone: 'Europe/Moscow'
        }
      };

      const response = await calendarClient.events.insert({
        calendarId: 'primary',
        resource: event
      });

      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Получение событий из календаря
  async getCalendarEvents(calendarClient, timeMin, timeMax) {
    try {
      const response = await calendarClient.events.list({
        calendarId: 'primary',
        timeMin: timeMin,
        timeMax: timeMax,
        singleEvents: true,
        orderBy: 'startTime'
      });

      return response.data.items;
    } catch (error) {
      throw error;
    }
  }

  // Обработка сообщений
  async handleMessage(bot, msg, botSettings) {
    const chatId = msg.chat.id;
    const userMessage = msg.text;
    
    // userId может прийти как ObjectId или как объект, извлекаем правильный ID
    let userId = botSettings.userId;
    // Если userId - это объект, извлекаем ID
    if (userId && typeof userId === 'object') {
      if (userId._id) {
        userId = userId._id;
        } else {
        await bot.sendMessage(chatId, '❌ Ошибка: не удалось определить пользователя.');
        return;
      }
    }
    
    const botId = botSettings._id;

    try {
      // Проверяем валидность userId
      if (!userId) {
        await bot.sendMessage(chatId, '❌ Ошибка: не удалось определить пользователя.');
        return;
      }
      
      // Получаем системный промпт
      let systemPrompt;
      try {
        systemPrompt = await this.databaseClient.getSystemPrompt(userId);
        } catch (error) {
        await bot.sendMessage(chatId, '❌ Ошибка: не удалось получить системный промпт бота.');
        return;
      }

      // Получаем настройки AI
      const aiSettings = await this.databaseClient.getAISettings(userId);
      
      if (!aiSettings) {
        await bot.sendMessage(chatId, '❌ Не удалось получить настройки AI. Используем настройки по умолчанию.');
        return;
      }
      
      // Проверяем баланс перед отправкой AI запроса
      try {
        const balanceResponse = await axios.get(`${this.databaseClient.baseURL}/api/users/${userId}/balance`, {
          headers: {
            'x-api-key': this.databaseClient.apiKey
          },
          timeout: 5000
        });
        
        const currentBalance = balanceResponse.data?.balance || 0;
        if (currentBalance < 1) {
          await bot.sendMessage(chatId, '⚠️ Недостаточно токенов для отправки сообщения. Пополните баланс.');
          return;
        }
      } catch (error) {
        // Продолжаем выполнение, если не удалось проверить баланс
      }

      // Сначала сохраняем сообщение пользователя в историю
      try {
        await this.databaseClient.addBotChatMessage(botId, chatId.toString(), 'user', userMessage);
        } catch (error) {
        }

      // Теперь получаем обновленную историю чата для контекста
      let chatContext = [];
      if (botSettings.contextEnabled !== false) {
        try {
          const chatHistory = await this.databaseClient.getBotChatHistory(botId, chatId.toString());
          if (chatHistory.success && chatHistory.messages) {
            // Используем лимит контекста из настроек бота или по умолчанию
            const contextLimit = botSettings.contextLimit || 30;
            chatContext = chatHistory.messages.slice(-contextLimit);
            // Детальное логирование контекста
            chatContext.forEach((msg, index) => {
              console.log(`🔍 Chat context message ${index}:`, msg.role, msg.content.substring(0, 100) + '...');
            });
          } else {
            console.log('🔍 No chat history found');
          }
        } catch (error) {
          console.log('🔍 Error loading chat history:', error.message);
        }
      } else {
        console.log('🔍 Chat history not available');
      }

      // Отправляем запрос к AI через Gateway
      const aiResponse = await this.sendToAI(
        aiSettings.defaultProvider,
        systemPrompt,
        userMessage,
        chatContext
      );
      
      console.log('🔍 AI response received:', aiResponse ? aiResponse.substring(0, 100) + '...' : 'No response');

      // Сохраняем ответ AI в историю
      try {
        await this.databaseClient.addBotChatMessage(botId, chatId.toString(), 'assistant', aiResponse);
      } catch (error) {
        console.log('🔍 Error saving AI response to chat history:', error.message);
      }

      // Проверяем, нужно ли создать событие в календаре
      const calendarAction = this.detectCalendarAction(userMessage, aiResponse);
      if (calendarAction) {
        await this.handleCalendarAction(bot, chatId, calendarAction, botSettings);
      } else {
        // Отправляем ответ пользователю
        await bot.sendMessage(chatId, aiResponse);
      }

      // Обновляем активность бота (время последней активности)
      try {
        // Получаем реальное количество сообщений из истории чата
        const realMessageCount = await this.databaseClient.getBotTotalMessageCount(botId);
        console.log('🔍 Real message count from chat history:', realMessageCount);
        
        // Обновляем только время активности и количество сообщений
        const updateResult = await this.databaseClient.updateBotActivity(userId, realMessageCount);
      } catch (error) {
        // Не прерываем выполнение, если не удалось обновить активность
        console.log('🔍 Error updating bot activity:', error.message);
      }

      // Списываем токены за использование AI через Balance Service
      try {
        // Проверяем, что у нас есть валидный userId
        if (!userId) {
          throw new Error('userId is undefined');
        }
        
        await this.databaseClient.updateUserBalance(userId, 1, 'deduct', `Использование ${aiSettings.defaultProvider} в Telegram боте`, {
          provider: aiSettings.defaultProvider,
          tokensUsed: 1,
          messageLength: userMessage.length,
          source: 'telegram-bot',
          botId: botSettings._id,
          chatId: chatId
        });
      } catch (error) {
        // Более информативное сообщение об ошибке
        let errorMessage = '⚠️ Ошибка списания токенов.';
        
        if (error.response?.data?.error === 'Insufficient Balance') {
          errorMessage = '⚠️ Недостаточно токенов для отправки сообщения. Пополните баланс.';
        } else if (error.response?.status === 400) {
          errorMessage = '⚠️ Ошибка валидации запроса на списание токенов.';
        } else if (error.response?.status === 500) {
          errorMessage = '⚠️ Внутренняя ошибка сервера при списании токенов.';
        }
        
        await bot.sendMessage(chatId, errorMessage);
      }

    } catch (error) {
      await bot.sendMessage(chatId, '❌ Произошла ошибка при обработке сообщения.');
    }
  }

  // Обработка команды очистки контекста
  async handleClearCommand(bot, msg, botSettings) {
    const chatId = msg.chat.id;
    
    // botId теперь приходит как ObjectId, используем напрямую
    const botId = botSettings._id;

    try {
      // Очищаем историю чата
      await this.databaseClient.clearBotChatHistory(botId, chatId.toString());
      
      await bot.sendMessage(chatId, '🧹 Контекст чата очищен! Теперь я буду отвечать без учета предыдущих сообщений.');
      
    } catch (error) {
      await bot.sendMessage(chatId, '❌ Ошибка при очистке контекста.');
    }
  }

  // Определение действий с календарем
  detectCalendarAction(userMessage, aiResponse) {
    // Более точные ключевые слова для календаря
    const calendarKeywords = [
      'создать событие', 'добавить в календарь', 'запланировать встречу', 
      'записать в календарь', 'поставить в календарь', 'создать встречу',
      'добавить встречу', 'запланировать событие', 'создать event'
    ];
    
    const listKeywords = [
      'показать события', 'список событий', 'какие события', 
      'что в календаре', 'показать календарь', 'события на сегодня',
      'события на завтра', 'мои встречи', 'мои события'
    ];
    
    const deleteKeywords = [
      'удалить событие', 'отменить встречу', 'удалить встречу', 
      'отменить событие', 'delete event', 'убрать из календаря'
    ];

    const message = (userMessage + ' ' + aiResponse).toLowerCase();

    // Проверяем точные совпадения фраз
    if (calendarKeywords.some(keyword => message.includes(keyword))) {
      return { type: 'create', message: userMessage };
    } else if (listKeywords.some(keyword => message.includes(keyword))) {
      return { type: 'list', message: userMessage };
    } else if (deleteKeywords.some(keyword => message.includes(keyword))) {
      return { type: 'delete', message: userMessage };
    }

    return null;
  }

  // Обработка действий с календарем
  async handleCalendarAction(bot, chatId, action, botSettings) {
    try {
      // Проверяем, настроен ли календарь
      if (!botSettings.googleCalendarSettings || 
          !botSettings.googleCalendarSettings.clientId || 
          !botSettings.googleCalendarSettings.clientSecret) {
        await bot.sendMessage(chatId, '❌ Календарь не настроен. Пожалуйста, настройте Google Calendar в веб-интерфейсе.');
        return;
      }

      switch (action.type) {
        case 'create':
          await this.handleCreateEvent(action.message, botSettings);
          await bot.sendMessage(chatId, '✅ Событие создано в календаре!');
          break;
        case 'list':
          const events = await this.handleListEvents(botSettings);
          if (events && events.length > 0) {
            const eventsList = events.map(event => 
              `📅 ${event.summary} - ${new Date(event.start.dateTime || event.start.date).toLocaleString('ru-RU')}`
            ).join('\n');
            await bot.sendMessage(chatId, `📋 Ваши события:\n${eventsList}`);
          } else {
            await bot.sendMessage(chatId, '📋 У вас нет запланированных событий.');
          }
          break;
        case 'delete':
          await this.handleDeleteEvent(action.message, botSettings);
          await bot.sendMessage(chatId, '✅ Событие удалено из календаря!');
          break;
      }
    } catch (error) {
      // Более информативные сообщения об ошибках
      if (error.message.includes('No access, refresh token')) {
        await bot.sendMessage(chatId, '❌ Календарь не авторизован. Пожалуйста, обновите авторизацию Google Calendar в веб-интерфейсе.');
      } else if (error.message.includes('Event not found')) {
        await bot.sendMessage(chatId, '❌ Событие не найдено в календаре.');
      } else {
        await bot.sendMessage(chatId, '❌ Ошибка при работе с календарем. Проверьте настройки.');
      }
    }
  }

  // Создание события
  async handleCreateEvent(message, botSettings) {
    try {
      const calendarClient = await this.createGoogleCalendarClient(botSettings);
      const eventData = this.parseEventFromMessage(message);
      
      const event = await this.createCalendarEvent(calendarClient, eventData);
      
      return event;
    } catch (error) {
      throw error;
    }
  }

  // Список событий
  async handleListEvents(botSettings) {
    try {
      const calendarClient = await this.createGoogleCalendarClient(botSettings);
      const now = new Date();
      const endOfDay = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      
      const events = await this.getCalendarEvents(calendarClient, now.toISOString(), endOfDay.toISOString());
      
      return events || [];
    } catch (error) {
      throw error;
    }
  }

  // Удаление события
  async handleDeleteEvent(message, botSettings) {
    try {
      const calendarClient = await this.createGoogleCalendarClient(botSettings);
      const eventTitle = this.extractEventTitle(message);
      
      // Найти событие по названию
      const events = await this.getCalendarEvents(calendarClient, new Date().toISOString(), new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString());
      const event = events.find(e => e.summary.toLowerCase().includes(eventTitle.toLowerCase()));
      
      if (event) {
        await calendarClient.events.delete({
          calendarId: 'primary',
          eventId: event.id
        });
        return event;
      } else {
        throw new Error('Event not found');
      }
    } catch (error) {
      throw error;
    }
  }

  // Парсинг события из сообщения
  parseEventFromMessage(message) {
    const title = this.extractEventTitle(message);
    const timeInfo = this.extractTimeInfo(message);
    
    const startTime = this.parseDateTime(timeInfo.start);
    const endTime = this.parseDateTime(timeInfo.end);
    
    return {
      summary: title,
      description: message,
      startTime: startTime,
      endTime: endTime
    };
  }

  // Извлечение названия события
  extractEventTitle(message) {
    // Простая логика извлечения названия
    const words = message.split(' ');
    const titleWords = words.slice(0, Math.min(5, words.length));
    return titleWords.join(' ');
  }

  // Извлечение информации о времени
  extractTimeInfo(message) {
    // Простая логика извлечения времени
    const now = new Date();
    const start = new Date(now.getTime() + 60 * 60 * 1000); // +1 час
    const end = new Date(start.getTime() + 60 * 60 * 1000); // +1 час от начала
    
    return {
      start: start.toISOString(),
      end: end.toISOString()
    };
  }

  // Парсинг даты и времени
  parseDateTime(timeStr) {
    try {
      return new Date(timeStr).toISOString();
    } catch (error) {
      return new Date().toISOString();
    }
  }

  // Форматирование даты и времени
  formatDateTime(isoString) {
    return new Date(isoString).toLocaleString('ru-RU');
  }

  // Валидация токена бота
  async validateBotToken(botToken) {
    try {
      console.log('🔍 Validating bot token:', botToken ? '***' + botToken.slice(-4) : 'undefined');
      if (!botToken || botToken.trim() === '' || botToken === 'undefined') {
        return null;
      }
      
      // Проверяем, что токен выглядит как валидный Telegram токен
      if (!botToken.match(/^\d+:[A-Za-z0-9_-]{35}$/)) {
        console.log('🔍 Bot token format is invalid');
        return null;
      }
      
      const bot = new TelegramBot(botToken, { polling: false });
      const me = await bot.getMe();
      return me;
    } catch (error) {
      // Если токен недействителен, помечаем бота как неактивный
      if (error.code === 'ETELEGRAM' && error.response?.statusCode === 404) {
        console.log('🔍 Bot token invalid - bot may have been deleted');
      }
      
      return null;
    }
  }

  // Запуск бота
  async startBot(botSettings) {
    try {
      // Проверяем токен бота (используем только botToken)
      const botToken = botSettings.botToken;
      
      // Расшифровываем токен, если он зашифрован
      const decryptedToken = decryptToken(botToken);
      
      // Отладочная информация
      console.log('🔍 Starting bot with settings:', {
        botToken: botToken ? '***' + botToken.slice(-4) : 'undefined',
        decryptedToken: decryptedToken ? '***' + decryptedToken.slice(-4) : 'undefined',
        isActive: botSettings.isActive
      });
      console.log('🔍 Bot token:', botToken ? '***' + botToken.slice(-4) : 'undefined');
      console.log('🔍 Decrypted token:', decryptedToken ? '***' + decryptedToken.slice(-4) : 'undefined');
      
      const botInfo = await this.validateBotToken(decryptedToken);
      if (!botInfo) {
        // Попытка деактивировать бота с недействительным токеном
        const botId = botSettings._id || botSettings.userId;
        await this.deactivateInvalidBot(botId);
        throw new Error('Invalid bot token');
      }

      console.log('🔍 Bot validation successful');

      // Создаем экземпляр бота с расшифрованным токеном
      const bot = new TelegramBot(decryptedToken, { polling: true });

      // Обработчик сообщений
      bot.on('message', async (msg) => {
        await this.handleMessage(bot, msg, botSettings);
      });

      // Обработчик команд
      bot.onText(/\/clear/, async (msg) => {
        await this.handleClearCommand(bot, msg, botSettings);
      });

      // Обработчик ошибок
      bot.on('error', (error) => {
        console.error('🔍 Bot error:', error.message);
      });

      // Сохраняем бота в Map
      const botId = botSettings._id || botSettings.userId;
      this.bots.set(botId, bot);

      return bot;
    } catch (error) {
      throw error;
    }
  }

  // Остановка бота
  async stopBot(userId) {
    try {
      // userId теперь приходит как ObjectId, используем напрямую
      const bot = this.bots.get(userId);
      if (bot) {
        bot.stopPolling();
        this.bots.delete(userId);
        console.log('🔍 Bot stopped successfully');
      }
    } catch (error) {
      console.log('🔍 Error stopping bot:', error.message);
    }
  }

  // Деактивация бота с недействительным токеном
  async deactivateInvalidBot(botId) {
    try {
      // botId теперь приходит как ObjectId, используем напрямую
      // Обновляем статус бота в базе данных
      await this.databaseClient.updateTelegramBot(botId, { isActive: false });
      return true;
    } catch (error) {
      return false;
    }
  }

  // Запуск всех ботов
  async startAllBots() {
    try {
      const bots = await this.databaseClient.getTelegramBots();
      const activeBots = bots.filter(bot => bot.isActive);
      let startedBots = 0;
      let failedBots = 0;

      for (const bot of activeBots) {
        try {
          await this.startBot(bot);
          startedBots++;
        } catch (error) {
          const botId = bot._id || bot.userId;
          failedBots++;
          
          // Если токен недействителен, можно попробовать деактивировать бота
          if (error.message.includes('Invalid bot token')) {
            }
        }
      }

      } catch (error) {
      }
  }

  // Мониторинг ботов
  async monitorBots() {
    setInterval(async () => {
      try {
        const bots = await this.databaseClient.getTelegramBots();
        const activeBots = bots.filter(bot => bot.isActive);
        
        // Останавливаем неактивные боты
        for (const [userId, bot] of this.bots) {
          const isStillActive = activeBots.some(b => (b._id || b.userId).toString() === userId.toString());
          if (!isStillActive) {
            await this.stopBot(userId);
          }
        }

        // Запускаем новые активные боты
        for (const bot of activeBots) {
          const botId = bot._id || bot.userId;
          if (!this.bots.has(botId.toString())) {
            await this.startBot(bot);
          }
        }
      } catch (error) {
        }
    }, 30000); // Проверяем каждые 30 секунд
  }

  // Запуск процесса
  async start() {
    try {
      // Запускаем все активные боты
      await this.startAllBots();
      
      // Запускаем мониторинг
      this.monitorBots();
      
      } catch (error) {
      throw error;
    }
  }
}

module.exports = TelegramBotProcess;