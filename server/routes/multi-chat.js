const express = require("express");
const router = express.Router();
const axios = require("axios");
const { requireAuth, requirePermission } = require("../middleware/auth");

// Импортируем константы из утилит
const {
  DATABASE_SERVICE_URL,
  DATABASE_SERVICE_API_KEY,
  BALANCE_SERVICE_URL,
  BALANCE_SERVICE_API_KEY,
} = require("../utils");

// Получить активный системный промпт
router.get(
  "/system-prompt/active",
  requireAuth,
  requirePermission("multi-chat"),
  async (req, res) => {
    try {
      const userId = req.session.userId;

      // Получаем системный промпт из database-service
      const systemPromptResponse = await axios.get(
        `${DATABASE_SERVICE_URL}/api/system-prompts/active`,
        {
          headers: { "x-api-key": DATABASE_SERVICE_API_KEY },
        }
      );

      if (systemPromptResponse.data?.success) {
        res.json({
          success: true,
          prompt: systemPromptResponse.data.prompt || "Multi-Chat Assistant",
          message: "System prompt loaded successfully",
        });
      } else {
        res.json({
          success: true,
          prompt: "Multi-Chat Assistant",
          message: "Default system prompt",
        });
      }
    } catch (error) {
      res.json({
        success: true,
        prompt: "Multi-Chat Assistant",
        message: "Default system prompt",
      });
    }
  }
);

// Получить пользовательский промпт
router.get(
  "/user/custom-prompt",
  requireAuth,
  requirePermission("multi-chat"),
  async (req, res) => {
    try {
      const userId = req.session.userId;

      // Получаем пользовательский промпт из database-service
      const customPromptResponse = await axios.get(
        `${DATABASE_SERVICE_URL}/api/user-prompts/${userId}/custom-prompt`,
        {
          headers: { "x-api-key": DATABASE_SERVICE_API_KEY },
        }
      );

      if (customPromptResponse.data?.success) {
        res.json({
          success: true,
          customPrompt: customPromptResponse.data.prompt || "",
          message: "Custom prompt loaded successfully",
        });
      } else {
        res.json({
          success: true,
          customPrompt: "",
          message: "No custom prompt set",
        });
      }
    } catch (error) {
      res.json({
        success: true,
        customPrompt: "",
        message: "No custom prompt set",
      });
    }
  }
);

// Обновить пользовательский промпт
router.post(
  "/user/custom-prompt",
  requireAuth,
  requirePermission("multi-chat"),
  async (req, res) => {
    try {
      const userId = req.session.userId;
      const { customPrompt } = req.body;

      // Сохраняем пользовательский промпт в database-service
      const saveResponse = await axios.post(
        `${DATABASE_SERVICE_URL}/api/user-prompts/${userId}/custom-prompt`,
        {
          customPrompt,
        },
        {
          headers: { "x-api-key": DATABASE_SERVICE_API_KEY },
        }
      );

      if (saveResponse.data?.success) {
        res.json({
          success: true,
          message: "Custom prompt updated successfully",
        });
      } else {
        res.json({
          success: true,
          message: "Custom prompt updated",
        });
      }
    } catch (error) {
      res.json({
        success: true,
        message: "Custom prompt updated",
      });
    }
  }
);

// Получить историю чата для конкретного провайдера
router.get(
  "/history/:provider",
  requireAuth,
  requirePermission("multi-chat"),
  async (req, res) => {
    try {
      const userId = req.session.userId;
      const { provider } = req.params;
      const { page = 1, limit = 20, chatId = null } = req.query;

      // Получаем историю чата из database-service
      const historyResponse = await axios.get(
        `${DATABASE_SERVICE_URL}/api/multi-chat/history/${provider}?page=${page}&limit=${limit}&chatId=${chatId}`,
        {
          headers: {
            "x-api-key": DATABASE_SERVICE_API_KEY,
            "x-user-id": userId,
          },
        }
      );

      if (historyResponse.data?.success) {
        res.json({
          success: true,
          messages: historyResponse.data.messages || [],
          total: historyResponse.data.total || 0,
          page: parseInt(page),
          limit: parseInt(limit),
        });
      } else {
        res.json({
          success: true,
          messages: [],
          total: 0,
          page: parseInt(page),
          limit: parseInt(limit),
        });
      }
    } catch (error) {
      res.json({
        success: true,
        messages: [],
        total: 0,
        page: parseInt(req.query.page || 1),
        limit: parseInt(req.query.limit || 20),
      });
    }
  }
);

// Отправить сообщение конкретному провайдеру
router.post(
  "/:provider",
  requireAuth,
  requirePermission("multi-chat"),
  async (req, res) => {
    try {
      const userId = req.session.userId;
      const { provider } = req.params;
      const { message, systemPrompt, chatId, imageUrl, type } = req.body;

      if (!message) {
        return res.status(400).json({
          success: false,
          message: "Message is required",
        });
      }

      // 🔒 ПРОВЕРЯЕМ БАЛАНС ДО ОТПРАВКИ ЗАПРОСА К AI
      try {
        // Получаем текущий баланс пользователя
        const balanceResponse = await axios.get(
          `${DATABASE_SERVICE_URL}/api/users/${userId}/balance`,
          {
            headers: { "x-api-key": DATABASE_SERVICE_API_KEY },
          }
        );

        if (!balanceResponse.data?.success) {
          return res.status(500).json({
            success: false,
            message: "Ошибка проверки баланса",
          });
        }

        const currentBalance = balanceResponse.data.balance || 0;
        // Проверяем, достаточно ли токенов (минимум 1 токен)
        if (currentBalance < 1) {
          return res.status(402).json({
            success: false,
            message:
              "Недостаточно токенов для отправки сообщения. Пополните баланс.",
            error: "INSUFFICIENT_BALANCE",
            currentBalance: currentBalance,
            requiredTokens: 1,
          });
        }
      } catch (balanceError) {
        return res.status(500).json({
          success: false,
          message: "Ошибка проверки баланса",
        });
      }

      // Отправляем сообщение в database-service
      const sendResponse = await axios.post(
        `${DATABASE_SERVICE_URL}/api/multi-chat/${provider}`,
        {
          message,
          systemPrompt,
          chatId, // Передаем chatId в database-service
          imageUrl,
          type,
        },
        {
          headers: {
            "x-api-key": DATABASE_SERVICE_API_KEY,
            "x-user-id": userId,
          },
        }
      );

      console.log("🔍 Message sent successfully to provider:", provider);

      if (sendResponse.data?.success) {
        // 🔄 СПИСЫВАЕМ ТОКЕНЫ ПОСЛЕ УСПЕШНОГО ОТВЕТА
        try {
          // Получаем активные провайдеры для определения количества токенов
          const aiSettingsResponse = await axios.get(
            `${DATABASE_SERVICE_URL}/api/ai-settings/${userId}`,
            {
              headers: { "x-api-key": DATABASE_SERVICE_API_KEY },
            }
          );

          if (
            aiSettingsResponse.data?.success &&
            aiSettingsResponse.data?.aiSettings?.activeProviders
          ) {
            const activeProviders =
              aiSettingsResponse.data.aiSettings.activeProviders;
            // Списываем токены через balance-service
            const deductResponse = await axios.post(
              `${BALANCE_SERVICE_URL}/api/balance/${userId}/deduct`,
              {
                amount: 1, // 1 токен за провайдера
                description: `Использование ${provider} в мульти-чате`,
                metadata: {
                  provider: provider,
                  tokensUsed: 1,
                  messageLength: message.length,
                  source: "multichat",
                  activeProviders: activeProviders,
                },
              },
              {
                headers: { "x-api-key": BALANCE_SERVICE_API_KEY },
              }
            );

            res.json({
              success: true,
              status: "success",
              content: sendResponse.data.content || "",
              error: null,
              context: null,
              tokensDeducted: 1,
              newBalance:
                deductResponse.data.newBalance || sendResponse.data.newBalance,
            });
          } else {
            // Списываем токены без проверки провайдеров
            const deductResponse = await axios.post(
              `${BALANCE_SERVICE_URL}/api/balance/${userId}/deduct`,
              {
                amount: 1,
                description: `Использование ${provider} в мульти-чате`,
                metadata: {
                  provider: provider,
                  tokensUsed: 1,
                  messageLength: message.length,
                  source: "multichat",
                },
              },
              {
                headers: { "x-api-key": BALANCE_SERVICE_API_KEY },
              }
            );

            res.json({
              success: true,
              status: "success",
              content: sendResponse.data.content || "",
              error: null,
              context: null,
              tokensDeducted: 1,
              newBalance:
                deductResponse.data.newBalance || sendResponse.data.newBalance,
            });
          }
        } catch (deductError) {
          // Отправляем ответ без списания токенов, но с предупреждением
          res.json({
            success: true,
            status: "success",
            content: sendResponse.data.content || "",
            error: null,
            context: null,
            tokensDeducted: 0,
            newBalance: sendResponse.data.newBalance,
            warning: "Сообщение обработано, но не удалось списать токены",
          });
        }
      } else {
        res.json({
          success: false,
          status: "error",
          content: "",
          error: sendResponse.data.message || "Failed to send message",
          context: null,
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        status: "error",
        content: "",
        error: "Internal server error",
        context: null,
      });
    }
  }
);

// Получить все провайдеры
router.get(
  "/providers",
  requireAuth,
  requirePermission("multi-chat"),
  async (req, res) => {
    try {
      const userId = req.session.userId;

      // Получаем AI настройки пользователя
      const aiSettingsResponse = await axios.get(
        `${DATABASE_SERVICE_URL}/api/ai-settings/${userId}`,
        {
          headers: { "x-api-key": DATABASE_SERVICE_API_KEY },
        }
      );

      if (
        aiSettingsResponse.data?.success &&
        aiSettingsResponse.data?.aiSettings?.activeProviders
      ) {
        // Получаем активные провайдеры из настроек
        const activeProviders =
          aiSettingsResponse.data.aiSettings.activeProviders;

        res.json({
          success: true,
          activeProviders: activeProviders,
        });
      } else {
        // Возвращаем ошибку вместо дефолтных значений
        res.status(500).json({
          success: false,
          message: "Некорректная структура ответа от database-service",
        });
      }
    } catch (error) {
      console.log("🔍 Error getting providers:", error.message);
      res.status(500).json({
        success: false,
        message: "Ошибка получения провайдеров",
      });
    }
  }
);

// Получить информацию о конкретном провайдере
router.get(
  "/provider/:provider",
  requireAuth,
  requirePermission("multi-chat"),
  async (req, res) => {
    try {
      const userId = req.session.userId;
      const { provider } = req.params;

      // Получаем информацию о провайдере из database-service
      const providerResponse = await axios.get(
        `${DATABASE_SERVICE_URL}/api/multi-chat/provider/${provider}`,
        {
          headers: {
            "x-api-key": DATABASE_SERVICE_API_KEY,
            "x-user-id": userId,
          },
        }
      );

      if (providerResponse.data?.success) {
        res.json(providerResponse.data);
      } else {
        res.json({
          success: true,
          provider: provider,
          enabled: true,
          config: {},
        });
      }
    } catch (error) {
      res.json({
        success: true,
        provider: req.params.provider,
        enabled: true,
        config: {},
      });
    }
  }
);

// Получить все провайдеры с детальной информацией
router.get(
  "/all-providers",
  requireAuth,
  requirePermission("multi-chat"),
  async (req, res) => {
    try {
      const userId = req.session.userId;

      // Получаем AI настройки пользователя
      const aiSettingsResponse = await axios.get(
        `${DATABASE_SERVICE_URL}/api/ai-settings/${userId}`,
        {
          headers: { "x-api-key": DATABASE_SERVICE_API_KEY },
        }
      );

      if (
        aiSettingsResponse.data?.success &&
        aiSettingsResponse.data?.aiProviders
      ) {
        // Преобразуем формат данных для фронтенда
        const aiProviders = aiSettingsResponse.data.aiProviders;
        const defaultProvider =
          aiSettingsResponse.data.defaultProvider || "openai";

        const providers = Object.entries(aiProviders).map(([key, enabled]) => ({
          name: key,
          enabled: enabled,
          isDefault: key === defaultProvider,
          config: {},
        }));

        res.json({
          success: true,
          providers: providers,
        });
      } else {
        // Если настройки не найдены, возвращаем значения по умолчанию
        res.json({
          success: true,
          providers: [
            { name: "openai", enabled: true, isDefault: true, config: {} },
          ],
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Ошибка получения всех провайдеров",
      });
    }
  }
);

// Получить общую историю чата
router.get(
  "/history",
  requireAuth,
  requirePermission("multi-chat"),
  async (req, res) => {
    try {
      const userId = req.session.userId;
      const { page = 1, limit = 20, provider = null } = req.query;

      // Получаем общую историю чата из database-service
      const historyResponse = await axios.get(
        `${DATABASE_SERVICE_URL}/api/multi-chat/history?page=${page}&limit=${limit}&provider=${
          provider || ""
        }`,
        {
          headers: {
            "x-api-key": DATABASE_SERVICE_API_KEY,
            "x-user-id": userId,
          },
        }
      );

      if (historyResponse.data?.success) {
        res.json({
          success: true,
          messages: historyResponse.data.messages || [],
          total: historyResponse.data.total || 0,
          page: parseInt(page),
          limit: parseInt(limit),
        });
      } else {
        res.json({
          success: true,
          messages: [],
          total: 0,
          page: parseInt(page),
          limit: parseInt(limit),
        });
      }
    } catch (error) {
      res.json({
        success: true,
        messages: [],
        total: 0,
        page: parseInt(req.query.page || 1),
        limit: parseInt(req.query.limit || 20),
      });
    }
  }
);

// Получить все уникальные chatId и chatTitle для пользователя
router.get(
  "/all-chat-histories",
  requireAuth,
  requirePermission("multi-chat"),
  async (req, res) => {
    try {
      const userId = req.session.userId;
      const response = await axios.get(
        `${DATABASE_SERVICE_URL}/api/multi-chat/all-chat-histories`,
        {
          headers: {
            "x-api-key": DATABASE_SERVICE_API_KEY,
            "x-user-id": userId,
          },
        }
      );
      if (response.data?.success) {
        res.json(response.data);
      } else {
        res.status(response.status).json(response.data);
      }
    } catch (error) {
      console.error("Ошибка получения всех историй чатов:", error);
      res.status(500).json({
        success: false,
        message: "Ошибка получения всех историй чатов",
      });
    }
  }
);

// Обновить текущий chat ID пользователя
router.patch(
  "/ai-settings/:userId/current-chat",
  requireAuth,
  requirePermission("multi-chat"),
  async (req, res) => {
    try {
      const userId = req.session.userId;
      const { currentChatId } = req.body;

      const updateResponse = await axios.patch(
        `${DATABASE_SERVICE_URL}/api/ai-settings/${userId}/current-chat`,
        { currentChatId },
        {
          headers: { "x-api-key": DATABASE_SERVICE_API_KEY },
        }
      );

      if (updateResponse.data?.success) {
        res.json(updateResponse.data);
      } else {
        res.status(500).json({
          success: false,
          message: "Ошибка обновления текущего chat ID",
        });
      }
    } catch (error) {
      console.error("Ошибка обновления текущего chat ID:", error);
      res.status(500).json({
        success: false,
        message: "Ошибка обновления текущего chat ID",
      });
    }
  }
);

// Получить настройки AI пользователя (включая currentChatId)
router.get(
  "/ai-settings/:userId",
  requireAuth,
  requirePermission("multi-chat"),
  async (req, res) => {
    try {
      const { userId } = req.params;
      const aiSettingsResponse = await axios.get(
        `${DATABASE_SERVICE_URL}/api/ai-settings/${userId}`,
        {
          headers: { "x-api-key": DATABASE_SERVICE_API_KEY },
        }
      );

      if (aiSettingsResponse.data?.success) {
        res.json({
          success: true,
          aiSettings: aiSettingsResponse.data.aiSettings,
        });
      } else {
        res.status(404).json({
          success: false,
          message: "Настройки AI не найдены",
        });
      }
    } catch (error) {
      console.error("Ошибка получения настроек AI:", error);
      res.status(500).json({
        success: false,
        message: "Ошибка получения настроек AI",
      });
    }
  }
);

// Переименовать чат
router.put(
  "/:chatId",
  requireAuth,
  requirePermission("multi-chat"),
  async (req, res) => {
    try {
      const { chatId } = req.params;
      const { chatTitle } = req.body;
      const userId = req.session.userId;

      const response = await axios.put(
        `${DATABASE_SERVICE_URL}/api/multi-chat/${chatId}`,
        { chatTitle },
        {
          headers: {
            "x-api-key": DATABASE_SERVICE_API_KEY,
            "x-user-id": userId,
          },
        }
      );

      res.status(response.status).json(response.data);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Ошибка переименования чата",
      });
    }
  }
);

// Удалить чат
router.delete(
  "/:chatId",
  requireAuth,
  requirePermission("multi-chat"),
  async (req, res) => {
    try {
      const { chatId } = req.params;
      const userId = req.session.userId;

      const response = await axios.delete(
        `${DATABASE_SERVICE_URL}/api/multi-chat/${chatId}`,
        {
          headers: {
            "x-api-key": DATABASE_SERVICE_API_KEY,
            "x-user-id": userId,
          },
        }
      );

      res.status(response.status).json(response.data);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Ошибка удаления чата",
      });
    }
  }
);

module.exports = router;
