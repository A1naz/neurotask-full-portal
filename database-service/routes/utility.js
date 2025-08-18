const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// ===== UTILITY ENDPOINTS =====

// Проверка здоровья сервиса
router.get('/health', (req, res) => {
  try {
    const health = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    };

    res.json(health);
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// Получить статистику базы данных
router.get('/stats/database', async (req, res) => {
  try {
    const stats = {
      collections: [],
      totalDocuments: 0,
      databaseSize: 0,
      indexes: 0,
      connections: mongoose.connection.pool?.size() || 0
    };

    // Получаем список коллекций
    const collections = await mongoose.connection.db.listCollections().toArray();
    stats.collections = collections.map(col => col.name);

    // Подсчитываем общее количество документов
    for (const collectionName of stats.collections) {
      try {
        const count = await mongoose.connection.db.collection(collectionName).countDocuments();
        stats.totalDocuments += count;
      } catch (err) {
        }
    }

    // Получаем размер базы данных
    try {
      const dbStats = await mongoose.connection.db.stats();
      stats.databaseSize = dbStats.dataSize + dbStats.indexSize;
      stats.indexes = dbStats.indexes;
    } catch (err) {
      }

    res.json({
      success: true,
      stats: stats
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Ошибка получения статистики базы данных'
    });
  }
});

module.exports = router;
