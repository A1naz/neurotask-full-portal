const axios = require('axios');

// Константы для подключения к сервисам
const DATABASE_SERVICE_URL = process.env.DATABASE_SERVICE_URL || 'http://localhost:3012';
const DATABASE_SERVICE_API_KEY = process.env.DATABASE_SERVICE_API_KEY || 'database-service-secure-api-key-2024';
const BALANCE_SERVICE_URL = process.env.BALANCE_SERVICE_URL || 'http://localhost:3002';
const BALANCE_SERVICE_API_KEY = process.env.BALANCE_SERVICE_API_KEY || 'balance-service-secure-api-key-2024';

// Функция для сравнения паролей через database-service
const comparePassword = async (candidatePassword, hashedPassword) => {
  try {
    const response = await axios.post(`${DATABASE_SERVICE_URL}/api/auth/compare-password`, {
      candidatePassword,
      hashedPassword
    }, {
      headers: { 'x-api-key': DATABASE_SERVICE_API_KEY }
    });
    return response.data.isMatch;
  } catch (error) {
    return false;
  }
};

const toPublicJSON = (user) => {
  const publicUser = { ...user };
  delete publicUser.password;
  delete publicUser.verificationCode;
  delete publicUser.verificationExpires;
  return publicUser;
};

const verifyCode = (user, code) => {
  if (!user.verificationCode || !user.verificationExpires) {
    return false;
  }
  
  if (user.verificationCode !== code) {
    return false;
  }
  
  if (new Date() > new Date(user.verificationExpires)) {
    return false;
  }
  
  return true;
};

const isVerificationExpired = (user) => {
  return user.verificationExpires && new Date() > new Date(user.verificationExpires);
};

// Функция для генерации кода верификации
const generateVerificationCode = async () => {
  try {
    const response = await axios.post(`${DATABASE_SERVICE_URL}/api/auth/generate-verification-code`, {}, {
      headers: { 'x-api-key': DATABASE_SERVICE_API_KEY }
    });
    return response.data.code;
  } catch (error) {
    // Fallback на локальную генерацию
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
};

// Вспомогательные функции для Telegram ботов
const isGoogleCalendarConfigured = (botSettings) => {
  if (!botSettings?.integrations?.googleCalendar?.settings) {
    return false;
  }
  
  const settings = botSettings.integrations.googleCalendar.settings;
  return settings.clientId && settings.clientSecret;
};

// Функция для безопасного получения Telegram бота
const getTelegramBotSafely = async (userId) => {
  try {
    const response = await axios.get(`${DATABASE_SERVICE_URL}/api/telegram/bots/${userId}`, {
      headers: { 'x-api-key': DATABASE_SERVICE_API_KEY }
    });
    return response.data.botSettings;
  } catch (error) {
    if (error.response?.status === 404) {
      return null;
    }
    throw error;
  }
};

const createDefaultTelegramBotSettings = (userId, botToken) => {
  return {
    userId: userId,
    token: botToken,
    botToken: botToken, // Для совместимости
    isActive: false,
    aiProvider: 'openai',
    contextEnabled: true,
    contextLimit: 30,
    integrations: {
      googleCalendar: {
        enabled: false,
        settings: {}
      }
    },
    systemPrompt: 'Multi-Chat Assistant',
    companyName: '',
    customSystemPrompt: ''
  };
};

// Функция для списания токенов за мульти-чат
async function deductTokensForMultiChat(userId, providers, message) {
  try {
    console.log('🔍 Deducting tokens for user:', userId, 'providers:', providers);
    
    const requestData = {
      amount: providers.length,
      description: `Использование мульти-чата с ${providers.length} провайдером(ами): ${providers.join(', ')}`,
      metadata: {
        providers: providers,
        messageLength: message.length,
        source: 'multichat'
      }
    };
    
    const response = await axios.post(`${BALANCE_SERVICE_URL}/api/balance/${userId}/deduct`, requestData, {
      headers: { 'x-api-key': BALANCE_SERVICE_API_KEY }
    });
    
    return response.data;
  } catch (error) {
    throw error;
  }
}

module.exports = {
  comparePassword,
  generateVerificationCode,
  toPublicJSON,
  verifyCode,
  isVerificationExpired,
  isGoogleCalendarConfigured,
  getTelegramBotSafely,
  createDefaultTelegramBotSettings,
  deductTokensForMultiChat,
  DATABASE_SERVICE_URL,
  DATABASE_SERVICE_API_KEY,
  BALANCE_SERVICE_URL,
  BALANCE_SERVICE_API_KEY
};
