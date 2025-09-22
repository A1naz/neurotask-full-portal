const express = require('express');
const router = express.Router();
const axios = require('axios');
const { requireAuth } = require('../middleware/auth');

// Импортируем константы из утилит
const { DATABASE_SERVICE_URL, DATABASE_SERVICE_API_KEY } = require('../utils');

// Получить баланс токенов пользователя
router.get('/balance', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    
    const balanceResponse = await axios.get(`${DATABASE_SERVICE_URL}/api/users/${userId}/balance`, {
      headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
    });

    res.json(balanceResponse.data);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка получения баланса токенов'
    });
  }
});

// Получить историю токенов пользователя
router.get('/history', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const { page = 1, limit = 20, type = null, period, startDate, endDate, fetchAll } = req.query;
    
    const params = { page, limit, type, period, startDate, endDate, fetchAll };
    
    // Удаляем null/undefined параметры
    Object.keys(params).forEach(key => params[key] == null && delete params[key]);

    const historyResponse = await axios.get(`${DATABASE_SERVICE_URL}/api/users/${userId}/transactions`, {
      params,
      headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
    });

    res.json(historyResponse.data);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка получения истории токенов'
    });
  }
});

// Пополнить баланс токенов
router.post('/topup', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const { amount } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Сумма должна быть больше 0'
      });
    }

    const topupResponse = await axios.post(`${process.env.BALANCE_SERVICE_URL || 'http://localhost:3002'}/api/balance/${userId}/add`, {
      amount,
      description: 'Пополнение баланса через портал',
      metadata: {
        source: 'portal_topup',
        addedBy: userId
      }
    }, {
      headers: { 'x-api-key': process.env.BALANCE_SERVICE_API_KEY || 'balance-service-secure-api-key-2024' }
    });

    res.json(topupResponse.data);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка пополнения баланса токенов'
    });
  }
});

module.exports = router;
