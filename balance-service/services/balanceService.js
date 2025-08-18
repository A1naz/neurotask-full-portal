const queueService = require('./queueService');
const axios = require('axios');

// Database Service configuration
const DATABASE_SERVICE_URL = process.env.DATABASE_SERVICE_URL || 'http://localhost:3012';
const DATABASE_SERVICE_API_KEY = process.env.DATABASE_SERVICE_API_KEY || 'database-service-secure-api-key-2024';

// Функция для списания токенов через очередь
async function deductTokens(userId, amount, description, metadata = {}) {
  try {
    // Добавляем задачу в очередь
    const queueResult = await queueService.queueDeductTokens(userId, amount, description, metadata);
    
    return {
      success: true,
      jobId: queueResult.jobId,
      status: 'queued',
      message: 'Операция добавлена в очередь'
    };
  } catch (error) {
    throw error;
  }
}

// Функция для пополнения токенов через очередь
async function addTokens(userId, amount, description, metadata = {}) {
  try {
    // Добавляем задачу в очередь
    const queueResult = await queueService.queueAddTokens(userId, amount, description, metadata);
    
    return {
      success: true,
      jobId: queueResult.jobId,
      status: 'queued',
      message: 'Операция добавлена в очередь'
    };
  } catch (error) {
    throw error;
  }
}

// Функция для списания одного токена за провайдера
async function deductTokenForProvider(userId, provider, message) {
  return await deductTokens(
    userId,
    1,
    `Использование ${provider} в мульти-чате`,
    {
      provider: provider,
      tokensUsed: 1,
      messageLength: message.length,
      source: 'multichat'
    }
  );
}

// Функция для добавления бонусных токенов
async function addBonusTokens(userId, amount, reason, metadata = {}) {
  try {
    // Используем внутренний метод addTokens вместо прямого обращения к database-service
    const result = await addTokens(
      userId, 
      amount, 
      `Бонус: ${reason}`,
      {
        ...metadata,
        reason: reason,
        requestId: `bonus_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }
    );
    
    return result;
  } catch (error) {
    throw error;
  }
}

// Функция для возврата токенов
async function refundTokens(userId, amount, reason, metadata = {}) {
  try {
    // Используем внутренний метод addTokens вместо прямого обращения к database-service
    const result = await addTokens(
      userId, 
      amount, 
      `Возврат: ${reason}`,
      {
        ...metadata,
        reason: reason,
        requestId: `refund_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }
    );
    
    return result;
  } catch (error) {
    throw error;
  }
}

// Получение статистики очередей
async function getQueueStats() {
  return await queueService.getQueueStats();
}

// Очистка старых задач
async function cleanOldJobs() {
  return await queueService.cleanOldJobs();
}

module.exports = {
  deductTokens,
  addTokens,
  deductTokenForProvider,
  addBonusTokens,
  refundTokens,
  getQueueStats,
  cleanOldJobs
}; 