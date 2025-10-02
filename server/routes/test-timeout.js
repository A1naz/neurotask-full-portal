const express = require("express");
const router = express.Router();
const axios = require("axios");
const { requireAuth } = require("../middleware/auth");

// Импортируем константы из утилит
const {
  DATABASE_SERVICE_URL,
  DATABASE_SERVICE_API_KEY,
} = require("../utils");

// Прокси для длительного запроса
router.post("/long-request", requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;

    console.log(`🕐 Проксируем длительный запрос для пользователя ${userId}...`);

    // Проксируем запрос к database-service
    const response = await axios.post(
      `${DATABASE_SERVICE_URL}/api/test/long-request`,
      req.body,
      {
        headers: {
          "x-api-key": DATABASE_SERVICE_API_KEY,
          "x-user-id": userId,
          "Content-Type": "application/json",
        },
        timeout: 300000, // 300 секунд (5 минут)
      }
    );

    console.log(`✅ Длительный запрос завершен для пользователя ${userId}`);

    res.json(response.data);
  } catch (error) {
    console.error("Ошибка проксирования длительного запроса:", error);
    
    if (error.code === 'ECONNABORTED') {
      return res.status(408).json({
        error: "Request Timeout",
        message: "Запрос превысил максимальное время ожидания",
      });
    }

    res.status(500).json({
      error: "Internal Server Error",
      message: "Ошибка выполнения длительного запроса",
      details: error.message,
    });
  }
});

// Прокси для быстрого теста
router.get("/quick-test", requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;

    const response = await axios.get(
      `${DATABASE_SERVICE_URL}/api/test/quick-test`,
      {
        headers: {
          "x-api-key": DATABASE_SERVICE_API_KEY,
          "x-user-id": userId,
        },
        timeout: 10000,
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error("Ошибка проксирования быстрого теста:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Ошибка выполнения быстрого теста",
      details: error.message,
    });
  }
});

module.exports = router;
