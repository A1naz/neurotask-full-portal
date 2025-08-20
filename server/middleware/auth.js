const crypto = require('crypto');
const axios = require('axios');
const { DATABASE_SERVICE_URL, DATABASE_SERVICE_API_KEY } = require('../utils');


/**
 * Middleware для проверки аутентификации пользователя
 */
const requireAuth = (req, res, next) => {
  console.log('🔍 Checking authentication for user:', req.session.userId);
  
  if (req.session.userId) {
    next();
  } else {
    res.status(401).json({ message: 'Unauthorized' });
  }
};

/**
 * Middleware для генерации CSRF токена
 */
const generateCSRFToken = (req, res, next) => {
  if (!req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(32).toString('hex');
  }
  next();
};

/**
 * Middleware для проверки CSRF токена
 */
const validateCSRFToken = (req, res, next) => {
  const token = req.headers['x-csrf-token'] || req.body._csrf;
  
  if (!token) {
    return res.status(403).json({ 
      message: 'CSRF token missing',
      error: 'CSRF_TOKEN_MISSING'
    });
  }
  
  if (!req.session.csrfToken || token !== req.session.csrfToken) {
    return res.status(403).json({ 
      message: 'Invalid CSRF token',
      error: 'CSRF_TOKEN_INVALID'
    });
  }
  
  next();
};

/**
 * Middleware для проверки API ключа
 */
const validateApiKey = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'] || req.query.apiKey;
    
    if (!apiKey) {
      return res.status(401).json({ 
        message: 'API key missing',
        error: 'API_KEY_MISSING'
      });
    }
    
    // Здесь должна быть логика проверки API ключа
    // Пока просто пропускаем
    
    next();
  } catch (error) {
    res.status(500).json({
      message: 'Ошибка проверки API ключа',
      error: error.message
    });
  }
};

/**
 * Middleware для проверки роли пользователя
 */
const requireRole = (requiredRole) => {
  return async (req, res, next) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      // Здесь должна быть логика проверки роли пользователя
      // Пока просто пропускаем
      
      next();
    } catch (error) {
      res.status(500).json({
        message: 'Ошибка проверки роли',
        error: error.message
      });
    }
  };
};

/**
 * Middleware для логирования запросов
 */
const logRequest = (req, res, next) => {
  console.log(`🔍 ${new Date().toISOString()} - ${req.method} ${req.path} - User: ${req.session.userId || 'anonymous'}`);
  next();
};

/**
 * Middleware для обработки ошибок
 */
const errorHandler = (err, req, res, next) => {
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      message: 'Validation Error',
      errors: Object.values(err.errors).map(e => e.message)
    });
  }
  
  if (err.name === 'CastError') {
    return res.status(400).json({
      message: 'Invalid ID format'
    });
  }
  
  res.status(500).json({
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
};

/**
 * Middleware для проверки лимитов запросов
 */
const rateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const requests = new Map();
  
  return (req, res, next) => {
    const ip = req.ip;
    const now = Date.now();
    
    if (!requests.has(ip)) {
      requests.set(ip, { count: 1, resetTime: now + windowMs });
    } else {
      const userRequests = requests.get(ip);
      
      if (now > userRequests.resetTime) {
        userRequests.count = 1;
        userRequests.resetTime = now + windowMs;
      } else if (userRequests.count >= maxRequests) {
        return res.status(429).json({
          message: 'Too many requests',
          error: 'RATE_LIMIT_EXCEEDED'
        });
      } else {
        userRequests.count++;
      }
    }
    
    next();
  };
};

/**
 * Middleware для проверки прав доступа к разделу
 */
const requirePermission = (permissionId) => {
  return async (req, res, next) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
      // Получаем данные пользователя из database-service
      const userResponse = await axios.get(`${DATABASE_SERVICE_URL}/api/users/${req.session.userId}`, {
        headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
      });

      if (!userResponse.data.success) {
        return res.status(404).json({ message: 'User not found' });
      }

      const user = userResponse.data.user;

      
      // Владельцу можно все
      if (user.isTeamOwner) {
        return next();
      }

      // Проверяем наличие необходимого разрешения
      if (user.permissions && user.permissions.includes(permissionId)) {
        return next();
      }

      // Если ни одно из условий не выполнено, доступ запрещен
      return res.status(403).json({ message: 'Access Denied: You do not have the required permission.' });

    } catch (error) {
      console.error('Permission check error:', error.message);
      return res.status(500).json({ message: 'Internal server error during permission check.' });
    }
  };
};


module.exports = {
  requireAuth,
  generateCSRFToken,
  validateCSRFToken,
  validateApiKey,
  requireRole,
  logRequest,
  errorHandler,
  rateLimit,
  requirePermission,
};
