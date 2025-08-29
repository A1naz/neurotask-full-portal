const express = require("express");
const router = express.Router();
const { requireApiKey } = require("../middleware/auth");
const AISettings = require("../models/AISettings");
const ChatHistory = require("../models/ChatHistory");
const AIKeys = require("../models/AIKeys");
const ProjectSettings = require("../models/ProjectSettings");
const axios = require("axios"); // Добавляем axios для интеграции с внешними сервисами
const { v4: uuidv4 } = require('uuid');
const mongoose = require('mongoose');

// Отправить сообщение конкретному AI провайдеру
router.post("/:provider", requireApiKey, async (req, res) => {
  try {
    const { provider } = req.params;
    const { message, systemPrompt, chatId } = req.body;

    if (!message) {
      return res.status(400).json({
        error: "Bad Request",
        message: "message обязателен",
      });
    }

    const userId = req.headers["x-user-id"];

    if (!userId) {
      return res.status(400).json({
        error: "Bad Request",
        message: "x-user-id заголовок обязателен",
      });
    }

    if (!chatId) {
      return res.status(400).json({
        error: "Bad Request",
        message: "chatId обязателен",
      });
    }

    let chatTitle = "Без названия"; // Default title

    // Добавляем сообщение в историю чата. chatHistory.chatTitle will initially be "Без названия" if new
    const chatHistory = await ChatHistory.getOrCreate(userId, provider, chatId, chatTitle);
    
    // Determine if this is the first message being processed for this specific chatId across ALL providers
    // This means no other ChatHistory document for this chatId has a non-default chatTitle yet.
    const isGlobalFirstMessageForChatId = await ChatHistory.countDocuments({ chatId: chatId, chatTitle: { $ne: "Без названия" } }) === 0;

    // If it's the global first message for this chatId AND this specific provider's chat history is empty
    if (isGlobalFirstMessageForChatId && chatHistory.messages.length === 0) {
      console.log("Генерируем название чата с помощью DeepSeek");
      try {
        const titlePrompt = `Generate a concise title (3-7 words, in Russian, without quotes) for the following conversation based on the user\'s first message: \"${message}\".`;
        const deepseekTitleResponse = await axios.post(
          `${providerUrls.deepseek}/api/ai/deepseek`,
          {
            message: titlePrompt,
            systemPrompt: 'You are a helpful assistant that generates concise chat titles.',
            provider: 'deepseek',
            model: 'deepseek-chat',
            userId: userId,
          },
          {
            timeout: 10000,
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (deepseekTitleResponse.data?.success && deepseekTitleResponse.data?.content) {
          const generatedTitle = deepseekTitleResponse.data.content.trim();
          const newChatTitle = generatedTitle.replace(/^"|"$/g, ''); // Удаляем возможные кавычки
          
          // Update ALL ChatHistory documents for this chatId with the new title
          await ChatHistory.updateMany({ chatId: chatId }, { chatTitle: newChatTitle });
          // Also update the current chatHistory instance in memory
          chatHistory.chatTitle = newChatTitle;
          console.log(`✅ Chat title for chatId ${chatId} set to: "${newChatTitle}"`);
        } else {
          console.warn('⚠️ Failed to generate chat title from DeepSeek, using default. ChatId:', chatId);
          // If generation fails, we still set it to "Без названия" or leave it as is.
          // The current implementation of getOrCreate already sets it to "Без названия".
        }
      } catch (titleError) {
        console.error('❌ Error generating chat title from DeepSeek for ChatId:', chatId, titleError.message);
      }
    } else if (!isGlobalFirstMessageForChatId) {
      // If a chat title has already been set by another provider, ensure this instance reflects it.
      // This is important for consistency if this provider's chatHistory was created after title generation by another.
      const existingChat = await ChatHistory.findOne({ chatId: chatId, chatTitle: { $ne: "Без названия" } });
      if (existingChat && chatHistory.chatTitle === "Без названия") {
        chatHistory.chatTitle = existingChat.chatTitle;
        await chatHistory.save(); // Save to update this specific document's title
      }
    }

    // Добавляем сообщение пользователя
    await chatHistory.addMessage("user", message);

    // 🔍 ЗАГРУЖАЕМ КОНТЕКСТ ИЗ ИСТОРИИ ЧАТА
    const contextLimit = 10; // Лимит контекста для мультичата
    const chatContext = chatHistory.getContext(contextLimit);

    console.log("🔍 Multi-chat context loaded:", {
      contextLimit: contextLimit,
      contextMessages: chatContext.length,
      provider: provider,
    });
    // Интеграция с реальными AI провайдерами
    let aiResponse = "";
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
        deepseek: process.env.DEEPSEEK_SERVICE_URL,
      };

      const providerUrl = providerUrls[provider];
      ``;

      if (!providerUrl) {
        aiResponse = `Провайдер ${provider} не настроен. Отсутствует переменная окружения ${provider.toUpperCase()}_SERVICE_URL`;
        success = false;
      } else {
        // Определяем URL сервиса провайдера
        const providerUrls = {
          openai: process.env.OPENAI_SERVICE_URL,
          gemini: process.env.GEMINI_SERVICE_URL,
          anthropic: process.env.ANTHROPIC_SERVICE_URL,
          xai: process.env.XAI_SERVICE_URL,
          yandexgpt: process.env.YANDEXGPT_SERVICE_URL,
          gigachat: process.env.GIGACHAT_SERVICE_URL,
          deepseek: process.env.DEEPSEEK_SERVICE_URL,
        };

        const providerUrl = providerUrls[provider];
        
        const foundModel = await AISettings.findOne({ userId: userId }); // Исправлено: AISettings.findOne
        let selectedModel = foundModel?.selectedProviders ? foundModel.selectedProviders[`${provider}`] : provider;
        console.log("selectedModel", selectedModel);

        console.log("Отправляем запрос к AI провайдеру");
        // Отправляем запрос к AI провайдеру
        const aiResponseData = await axios.post(
          `${providerUrl}/api/ai/${provider}`,
          {
            message: message,
            systemPrompt:
              typeof systemPrompt === "object"
                ? systemPrompt.prompt
                : systemPrompt ||
                  "Ты полезный ассистент. Отвечай на вопросы пользователя кратко и по делу.",
            provider: provider,
            model: selectedModel,
            context: chatContext, // 🔍 ПЕРЕДАЕМ КОНТЕКСТ В AI ПРОВАЙДЕР
            userId: userId,
          },
          {
            timeout: 30000,
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        console.log("aiResponseData.data" + aiResponseData.data);

        if (aiResponseData.data?.success) {
          aiResponse =
            aiResponseData.data.content ||
            aiResponseData.data.response ||
            "Ответ получен от AI провайдера";
        } else {
          aiResponse = `Ошибка от провайдера ${provider}: ${
            aiResponseData.data?.message || "Неизвестная ошибка"
          }`;
          success = false;
        }
      }
    } catch (aiError) {
      aiResponse = `Ошибка связи с провайдером ${provider}: ${aiError.message}`;
      success = false;
    }

    // Добавляем ответ AI в историю
    await chatHistory.addMessage("assistant", aiResponse);

    console.log("aiResponse", aiResponse);

    res.json({
      success: success,
      status: success ? "success" : "error",
      content: aiResponse,
      error: success ? null : aiResponse,
      context: chatContext, // 🔍 ВОЗВРАЩАЕМ КОНТЕКСТ В ОТВЕТЕ
      contextInfo: {
        totalMessages: chatHistory.messages.length,
        contextUsed: chatContext.length,
        contextLimit: contextLimit,
      },
    });
  } catch (error) {
    res.status(500).json({
      error: "Internal Server Error",
      message: "Ошибка отправки сообщения провайдеру",
    });
  }
});

// Получить информацию о конкретном провайдере
router.get("/provider/:provider", requireApiKey, async (req, res) => {
  try {
    const { provider } = req.params;

    // Пока возвращаем заглушку
    res.json({
      success: true,
      provider: provider,
      enabled: true,
      config: {},
    });
  } catch (error) {
    res.status(500).json({
      error: "Internal Server Error",
      message: "Ошибка получения информации о провайдере",
    });
  }
});

// Получить все провайдеры с детальной информацией
router.get("/all-providers", requireApiKey, async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];

    if (!userId) {
      return res.status(400).json({
        error: "Bad Request",
        message: "x-user-id заголовок обязателен",
      });
    }

    // Получаем AI настройки пользователя
    const aiSettings = await AISettings.findByUserId(userId);

    if (!aiSettings || !aiSettings.activeProviders) {
      return res.status(404).json({
        error: "Not Found",
        message: "AI настройки не найдены для пользователя",
      });
    }

    const providers = aiSettings.activeProviders.map((provider) => ({
      name: provider,
      enabled: true,
      isDefault: provider === aiSettings.defaultProvider,
      config: {},
    }));

    res.json({
      success: true,
      providers: providers,
    });
  } catch (error) {
    res.status(500).json({
      error: "Internal Server Error",
      message: "Ошибка получения всех провайдеров",
    });
  }
});

// Получить список активных провайдеров для MultiChat
router.get("/providers", requireApiKey, async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];

    if (!userId) {
      return res.status(400).json({
        error: "Bad Request",
        message: "x-user-id заголовок обязателен",
      });
    }

    // Получаем AI настройки пользователя
    const aiSettings = await AISettings.findByUserId(userId);
    if (!aiSettings || !aiSettings.activeProviders) {
      return res.status(404).json({
        error: "Not Found",
        message: "AI настройки не найдены для пользователя",
      });
    }

    res.json({
      success: true,
      activeProviders: aiSettings.activeProviders,
    });
  } catch (error) {
    res.status(500).json({
      error: "Internal Server Error",
      message: "Ошибка получения провайдеров",
    });
  }
});

// Получить историю мульти-чата
router.get('/history', requireApiKey, async (req, res) => {
  try {
    const { page = 1, limit = 20, provider = null } = req.query;

    const userId = req.headers["x-user-id"];

    if (!userId) {
      return res.status(400).json({
        error: "Bad Request",
        message: "x-user-id заголовок обязателен",
      });
    }

    // Пока возвращаем заглушку
    res.json({
      success: true,
      messages: [],
      total: 0,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    res.status(500).json({
      error: "Internal Server Error",
      message: "Ошибка получения истории мульти-чата",
    });
  }
});

// Получить историю чата для конкретного провайдера
router.get('/history/:provider', requireApiKey, async (req, res) => {
  try {
    const { provider } = req.params;
    const { chatId } = req.query;

    const userId = req.headers["x-user-id"];

    if (!userId) {
      return res.status(400).json({
        error: "Bad Request",
        message: "x-user-id заголовок обязателен",
      });
    }

    if (!chatId) {
      return res.status(400).json({
        error: "Bad Request",
        message: "chatId обязателен",
      });
    }

    const chatHistory = await ChatHistory.findOne({ userId, provider, chatId });

    res.json({
      success: true,
      messages: chatHistory ? chatHistory.messages : [],
    });
  } catch (error) {
    res.status(500).json({
      error: "Internal Server Error",
      message: "Ошибка получения истории чата",
    });
  }
});

// Получить все уникальные chatId и chatTitle для пользователя
router.get('/all-chat-histories', requireApiKey, async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];

    if (!userId) {
      return res.status(400).json({
        error: "Bad Request",
        message: "x-user-id заголовок обязателен",
      });
    }

    // Проверяем валидность userId перед использованием его в агрегации
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Неверный формат userId",
      });
    }

    // Используем агрегацию для получения уникальных пар chatId и chatTitle
    const chatHistories = await ChatHistory.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId), chatId: { $exists: true, $ne: null }, chatTitle: { $exists: true, $ne: null } } },
      { $group: { _id: "$chatId", chatTitle: { $first: "$chatTitle" }, lastActivity: { $max: "$lastActivity" } } },
      { $project: { _id: 0, chatId: "$_id", chatTitle: { $ifNull: ["$chatTitle", "Без названия"] }, lastActivity: 1 } },
      { $sort: { lastActivity: -1 } }
    ]);

    res.json({
      success: true,
      chatHistories: chatHistories,
    });
  } catch (error) {
    console.error('Ошибка получения списка чатов:', error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Ошибка получения списка чатов",
    });
  }
});


module.exports = router;
