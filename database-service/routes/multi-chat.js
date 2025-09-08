const express = require("express");
const router = express.Router();
const { requireApiKey } = require("../middleware/auth");
const AISettings = require("../models/AISettings");
const ChatHistory = require("../models/ChatHistory");
const AIKeys = require("../models/AIKeys");
const ProjectSettings = require("../models/ProjectSettings");
const axios = require("axios"); // Добавляем axios для интеграции с внешними сервисами
const { v4: uuidv4 } = require("uuid");
const mongoose = require("mongoose");

// Отправить сообщение конкретному AI провайдеру
router.post("/:provider", requireApiKey, async (req, res) => {
  try {
    const { provider } = req.params;
    const { message, systemPrompt, chatId, imageUrl } = req.body; // Добавляем imageUrl

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

    const defaultChatTitle = `Чат ${new Date().toLocaleDateString("ru-RU")}`; // Placeholder title, will only be used if chat is new

    // Добавляем сообщение в историю чата
    const chatHistory = await ChatHistory.getOrCreate(
      userId,
      provider,
      chatId,
      defaultChatTitle
    );
    // Добавляем сообщение пользователя: сохраняем текст и ссылку на изображение в content через тег
    const contentToSave = imageUrl ? `${message} <IMAGE_URL:${imageUrl}>` : message;
    console.log("🔍 contentToSave", contentToSave);
    console.log("🔍 imageUrl", imageUrl);
    await chatHistory.addMessage("user", contentToSave, imageUrl); // Передаем imageUrl

    // 🔍 ЗАГРУЖАЕМ КОНТЕКСТ ИЗ ИСТОРИИ ЧАТА
    const contextLimit = 10; // Лимит контекста для мультичата
    const chatContext = chatHistory.getContext(contextLimit);

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

      const providerUrl = providerUrls["openai"];

      if (!providerUrl) {
        aiResponse = `Провайдер ${provider} не настроен. Отсутствует переменная окружения ${provider.toUpperCase()}_SERVICE_URL`;
        success = false;
      } else {
        const aiSettings = await AISettings.findByUserId(userId);

        let selectedModel = aiSettings?.selectedModels
          ? aiSettings.selectedModels[provider]
          : provider;

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
            ...(imageUrl &&
              (provider === "veo3" || provider === "imagen") && { imageUrl }), // Добавляем imageUrl для veo3 и imagen
            numberOfImages: 1,
          },
          {
            timeout: 200000,
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (aiResponseData.data?.success) {
          let contentToSend;
          if (
            aiResponseData.data.provider === "imagen" &&
            Array.isArray(aiResponseData.data.images) &&
            aiResponseData.data.images.length > 0
          ) {
            contentToSend = aiResponseData.data.images.join("\n");
          } else if (aiResponseData.data.provider === "veo3" && aiResponseData.data.videoUrl) {
            contentToSend = aiResponseData.data.videoUrl;
          } else {
            contentToSend = aiResponseData.data.content ||
            aiResponseData.data.response ||
            aiResponseData.data?.message ||
            "Неизвестная ошибка";
          }
          aiResponse = contentToSend;
        } else {
          aiResponse = `Ошибка от провайдера ${provider}: ${
            aiResponseData.data?.message || "Неизвестная ошибка"
          }`;
          success = false;
        }
      }
    } catch (aiError) {
      console.log("🔍 aiError", aiError);
      aiResponse = `Ошибка связи с провайдером ${provider}: ${aiError.message}`;
      success = false;
    }

    // Добавляем ответ AI в историю
    await chatHistory.addMessage("assistant", aiResponse);

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
    console.log("🔍 error", error);
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
router.get("/history", requireApiKey, async (req, res) => {
  try {
    const { page = 1, limit = 20, provider = null, chatId = null } = req.query;

    const userId = req.headers["x-user-id"];

    if (!userId) {
      return res.status(400).json({
        error: "Bad Request",
        message: "x-user-id заголовок обязателен",
      });
    }

    let query = { userId: new mongoose.Types.ObjectId(userId) };
    if (provider) {
      query.provider = provider;
    }
    if (chatId) {
      query.chatId = chatId;
    }

    const total = await ChatHistory.countDocuments(query);
    const history = await ChatHistory.find(query)
      .sort({ lastActivity: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const formattedHistory = history.map((chat) => ({
      // Изменил "messages" на "chatHistory" и добавил chatTitle и chatId
      chatId: chat.chatId,
      chatTitle: chat.chatTitle,
      provider: chat.provider,
      lastActivity: chat.lastActivity,
      messages: chat.messages,
    }));

    res.json({
      success: true,
      messages: formattedHistory, // Возвращаем отформатированную историю, а не просто пустой массив
      total: total,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    console.error("Ошибка получения истории мульти-чата:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Ошибка получения истории мульти-чата",
    });
  }
});

// Получить историю чата для конкретного провайдера
router.get("/history/:provider", requireApiKey, async (req, res) => {
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

    const chatHistory = await ChatHistory.findOne({ chatId, provider, userId });

    // console.log("🔍 chatHistory", chatHistory);

    res.json({
      success: true,
      messages: chatHistory ? chatHistory.messages : [],
      chatId: chatHistory ? chatHistory.chatId : null, // Добавлено
      chatTitle: chatHistory ? chatHistory.chatTitle : null, // Добавлено
      provider: chatHistory ? chatHistory.provider : null, // Добавлено
      lastActivity: chatHistory ? chatHistory.lastActivity : null, // Добавлено
    });
  } catch (error) {
    console.error("Ошибка получения истории чата:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Ошибка получения истории чата",
    });
  }
});

// Получить все уникальные chatId и chatTitle для пользователя
router.get("/all-chat-histories", requireApiKey, async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];

    if (!userId) {
      return res.status(400).json({
        error: "Bad Request",
        message: "x-user-id заголовок обязателен",
      });
    }

    // Используем агрегацию для получения уникальных чатов с последней активностью
    const chatSummaries = await ChatHistory.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          chatId: { $exists: true, $ne: null },
        },
      },
      { $sort: { lastActivity: -1 } },
      {
        $group: {
          _id: "$chatId",
          lastActivity: { $first: "$lastActivity" },
          provider: { $first: "$provider" },
          chatTitle: { $first: "$chatTitle" },
        },
      },
      {
        $project: {
          _id: 0,
          chatId: "$_id",
          lastActivity: 1,
          provider: 1,
          chatTitle: 1,
        },
      },
      { $sort: { lastActivity: -1 } },
    ]);

    // Получаем названия чатов из AISettings
    const aiSettings = await AISettings.findByUserId(userId);
    const chatTitlesMap =
      aiSettings && aiSettings.chatTitles
        ? new Map(Object.entries(aiSettings.chatTitles))
        : new Map();

    const enrichedChatHistories = chatSummaries.map((chat) => ({
      chatId: chat.chatId,
      chatTitle: chatTitlesMap.has(chat.chatId)
        ? chatTitlesMap.get(chat.chatId)
        : chat.chatTitle ||
          `Чат ${new Date(chat.lastActivity).toLocaleDateString("ru-RU")}`,
      lastActivity: chat.lastActivity,
      provider: chat.provider,
    }));

    res.json({
      success: true,
      chatHistories: enrichedChatHistories,
    });
  } catch (error) {
    console.error("Ошибка получения списка чатов:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Ошибка получения списка чатов",
    });
  }
});

module.exports = router;
