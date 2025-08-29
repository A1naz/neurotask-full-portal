const express = require("express");
const router = express.Router();
const { requireApiKey } = require("../middleware/auth");
const AISettings = require("../models/AISettings");
const axios = require("axios");

router.post("/generate-name", requireApiKey, async (req, res) => {
  try {
    const { chatId, message, provider } = req.body;

    if (!chatId || !message || !provider) {
      return res.status(400).json({
        error: "Bad Request",
        message: "chatId, message, and provider are required",
      });
    }

    const userId = req.headers["x-user-id"];

    if (!userId) {
      return res.status(400).json({
        error: "Bad Request",
        message: "x-user-id header is required",
      });
    }

    // Call DEEPSEEK_SERVICE to generate chat name
    const providerUrls = {
      openai: process.env.OPENAI_SERVICE_URL,
      gemini: process.env.GEMINI_SERVICE_URL,
      anthropic: process.env.ANTHROPIC_SERVICE_URL,
      xai: process.env.XAI_SERVICE_URL,
      yandexgpt: process.env.YANDEXGPT_SERVICE_URL,
      gigachat: process.env.GIGACHAT_SERVICE_URL,
      deepseek: process.env.DEEPSEEK_SERVICE_URL,
    };

    const deepseekServiceUrl = providerUrls["deepseek"];

    if (!deepseekServiceUrl) {
      return res.status(500).json({
        error: "Internal Server Error",
        message: "DEEPSEEK_SERVICE_URL is not configured",
      });
    }

    const systemPrompt = "Ты - умный помощник, который кратко и по существу называет чаты. Назови этот чат на основе первого сообщения пользователя.";

    let chatName = `Новый чат ыыввфы${new Date().toLocaleDateString('ru-RU')}`;
    try {
      const aiResponse = await axios.post(
        `${deepseekServiceUrl}/api/ai/deepseek`,
        {
          message: message,
          systemPrompt: systemPrompt,
          provider: "deepseek",
          model: "deepseek-chat", // Assuming a specific model for chat naming
          context: [], // No prior context needed for naming
          userId: userId,
        },
        {
          timeout: 30000,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (aiResponse.data?.success && aiResponse.data?.content) {
        chatName = aiResponse.data.content.replace(/["\\]/g, '').trim();
      }
    } catch (error) {
      console.error("Error communicating with DeepSeek service:", error);
      // chatName will remain the default if there's an error
    }

    // Update the chatTitle in AISettings for the specific chat ID
    await AISettings.updateChatTitle(userId, chatId, chatName);

    res.json({
      success: true,
      chatName: chatName,
    });
  } catch (error) {
    console.error("Error generating chat name in route:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Ошибка генерации имени чата",
    });
  }
});

module.exports = router;
