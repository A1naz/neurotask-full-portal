const express = require("express");
const router = express.Router();
const { requireApiKey } = require("../middleware/auth");

// Тестовый эндпоинт с задержкой 120 секунд
router.post("/long-request", requireApiKey, async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];
    
    if (!userId) {
      return res.status(400).json({
        error: "Bad Request",
        message: "x-user-id заголовок обязателен",
      });
    }

    console.log(`🕐 Начинаем длительный запрос для пользователя ${userId}...`);
    
    // Имитируем длительную обработку (120 секунд)
    await new Promise(resolve => setTimeout(resolve, 120000));
    
    console.log(`✅ Длительный запрос завершен для пользователя ${userId}`);
    
    res.json({
      success: true,
      message: "Длительный запрос успешно завершен через 120 секунд!",
      timestamp: new Date().toISOString(),
      userId: userId,
      duration: "120 секунд"
    });
    
  } catch (error) {
    console.error("Ошибка в длительном запросе:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Ошибка выполнения длительного запроса",
    });
  }
});

// Быстрый тестовый эндпоинт для сравнения
router.get("/quick-test", requireApiKey, async (req, res) => {
  try {
    res.json({
      success: true,
      message: "Быстрый тест успешно выполнен!",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Ошибка в быстром тесте:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Ошибка выполнения быстрого теста",
    });
  }
});

module.exports = router;
