const express = require('express');
const router = express.Router();

// Простой ping endpoint для проверки доступности
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'pong',
    timestamp: new Date().toISOString(),
    server: 'Main Server'
  });
});

module.exports = router;
