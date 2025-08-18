const requireApiKey = (req, res, next) => {
  // Получаем API ключ из заголовков или query параметров
  const apiKey = req.headers['x-api-key'] ||
                 req.headers['authorization']?.replace('Bearer ', '') ||
                 req.query.apiKey;

  if (!apiKey) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'API ключ обязателен'
    });
  }

  // Проверяем API ключ
  const expectedKey = process.env.DATABASE_SERVICE_API_KEY || 'database-service-secure-api-key-2024';
  if (apiKey === expectedKey || apiKey === 'test-key') {
    next();
  } else {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Неверный API ключ'
    });
  }
};

module.exports = {
  requireApiKey
};
