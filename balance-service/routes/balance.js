const express = require('express');
const router = express.Router();
const balanceService = require('../services/balanceService');
const axios = require('axios'); // Added axios for database-service interaction

// Middleware для проверки API ключа
const requireApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'] || req.query.apiKey;
  
  if (!apiKey || apiKey !== process.env.BALANCE_SERVICE_API_KEY) {
    return res.status(401).json({ 
      error: 'Unauthorized',
      message: 'Неверный API ключ' 
    });
  }
  
  next();
};

// Эти маршруты перенесены в server.js для лучшей архитектуры

// Получить баланс пользователя
router.get('/:userId', requireApiKey, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Получаем баланс из database-service
    const response = await axios.get(`${process.env.DATABASE_SERVICE_URL || 'http://localhost:3012'}/api/users/${userId}/balance`, {
      headers: { 'Authorization': `Bearer ${process.env.DATABASE_SERVICE_API_KEY || 'database-service-secure-api-key-2024'}` }
    });

    res.json(response.data);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка получения баланса'
    });
  }
});

module.exports = router;
