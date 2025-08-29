const express = require('express');
const router = express.Router();
const axios = require('axios');
const { requireAuth } = require('../middleware/auth');

// Импортируем константы из утилит
const utils = require('../utils');
const { DATABASE_SERVICE_URL, DATABASE_SERVICE_API_KEY } = utils;

// Получить баланс пользователя
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    
    const balanceResponse = await axios.get(`${DATABASE_SERVICE_URL}/api/users/${userId}/balance`, {
      headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
    });


    res.json(balanceResponse.data);

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка получения баланса'
    });
  }
});

// Получить транзакции пользователя
router.get('/transactions', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const { page = 1, limit = 20, type = null, filters = {} } = req.query;
    
    const transactionsResponse = await axios.get(`${DATABASE_SERVICE_URL}/api/users/${userId}/transactions`, {
      params: { page, limit, type, ...filters },
      headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
    });

    res.json(transactionsResponse.data);

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка получения транзакций'
    });
  }
});

// Пополнить баланс
router.post('/add', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const { amount, description, metadata = {} } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Сумма должна быть больше 0'
      });
    }

    if (!description) {
      return res.status(400).json({
        success: false,
        message: 'Описание транзакции обязательно'
      });
    }

    const addResponse = await axios.post(`${process.env.BALANCE_SERVICE_URL || 'http://localhost:3002'}/api/balance/${userId}/add`, {
      amount,
      description,
      metadata: {
        ...metadata,
        source: 'manual_add',
        addedBy: req.session.userId
      }
    }, {
      headers: { 'x-api-key': process.env.BALANCE_SERVICE_API_KEY || 'balance-service-secure-api-key-2024' }
    });

    res.json(addResponse.data);

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка пополнения баланса'
    });
  }
});

// Списать с баланса
router.post('/deduct', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const { amount, description, metadata = {} } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Сумма должна быть больше 0'
      });
    }

    if (!description) {
      return res.status(400).json({
        success: false,
        message: 'Описание транзакции обязательно'
      });
    }

    const deductResponse = await axios.post(`${process.env.BALANCE_SERVICE_URL || 'http://localhost:3002'}/api/balance/${userId}/deduct`, {
      amount,
      description,
      metadata: {
        ...metadata,
        source: 'manual_deduct',
        deductedBy: req.session.userId
      }
    }, {
      headers: { 'x-api-key': process.env.BALANCE_SERVICE_API_KEY || 'balance-service-secure-api-key-2024' }
    });

    res.json(deductResponse.data);

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка списания с баланса'
    });
  }
});

// Получить статистику транзакций
router.get('/stats', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const { period = 'month', startDate, endDate } = req.query;
    
    const statsResponse = await axios.get(`${DATABASE_SERVICE_URL}/api/users/${userId}/transactions`, {
      params: { 
        page: 1, 
        limit: 1000, 
        period, 
        startDate, 
        endDate,
        includeStats: true 
      },
      headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
    });

    // Вычисляем статистику на основе транзакций
    const transactions = statsResponse.data.transactions || [];
    const stats = {
      totalTransactions: transactions.length,
      totalAdded: 0,
      totalDeducted: 0,
      currentBalance: 0,
      period: period,
      startDate: startDate,
      endDate: endDate
    };

    transactions.forEach(transaction => {
      if (transaction.type === 'top_up' || transaction.type === 'refund' || transaction.type === 'bonus') {
        stats.totalAdded += transaction.amount;
      } else if (transaction.type === 'spend') {
        stats.totalDeducted += transaction.amount;
      }
    });

    stats.currentBalance = stats.totalAdded - stats.totalDeducted;

    res.json({
      success: true,
      stats: stats
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка получения статистики транзакций'
    });
  }
});

module.exports = router;
