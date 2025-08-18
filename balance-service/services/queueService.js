const Queue = require('bull');
const Redis = require('ioredis');
const axios = require('axios');

// Database Service Client
class DatabaseServiceClient {
  constructor() {
    this.baseURL = process.env.DATABASE_SERVICE_URL || 'http://localhost:3012';
    this.apiKey = process.env.DATABASE_SERVICE_API_KEY || 'your-database-service-api-key-here';
    
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey
      }
    });
  }

  async updateUserBalance(userId, amount, type, description, metadata) {
    try {
      // Определяем endpoint в зависимости от типа операции
      const endpoint = `/api/users/${userId}/balance`;
      const requestData = {
        amount: Math.abs(amount), // Убираем знак, так как тип определяет операцию
        type: type,
        description,
        metadata
      };
      
      const response = await this.client.post(endpoint, requestData);
      
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

const databaseClient = new DatabaseServiceClient();

// Создаем Redis клиент
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3
});

// Создаем очереди
const deductQueue = new Queue('balance-deduct', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD
  }
});

const addQueue = new Queue('balance-add', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD
  }
});

// Обработчик для списания токенов
deductQueue.process(async (job) => {
  const { userId, amount, description, metadata } = job.data;
  
  try {
    // Используем Database Service для списания
    const result = await databaseClient.updateUserBalance(
      userId,
      amount, // Положительное значение, тип 'spend' определяет списание
      'spend',
      description,
      {
        ...metadata,
        jobId: job.id,
        requestId: `queue_${job.id}_${Date.now()}`
      }
    );
    
    return {
      success: true,
      newBalance: result.newBalance,
      transaction: result.transaction,
      jobId: job.id
    };
  } catch (error) {
    throw error;
  }
});

// Обработчик для пополнения токенов
addQueue.process(async (job) => {
  const { userId, amount, description, metadata } = job.data;
  
  try {
    // Используем Database Service для пополнения
    const result = await databaseClient.updateUserBalance(
      userId,
      amount,
      'top_up',
      description,
      {
        ...metadata,
        jobId: job.id,
        requestId: `queue_${job.id}_${Date.now()}`
      }
    );
    
    return {
      success: true,
      newBalance: result.newBalance,
      transaction: result.transaction,
      jobId: job.id
    };
  } catch (error) {
    throw error;
  }
});

// Обработка ошибок
deductQueue.on('failed', (job, err) => {
  });

addQueue.on('failed', (job, err) => {
  });

// Функция для добавления задачи списания в очередь
async function queueDeductTokens(userId, amount, description, metadata = {}) {
  try {
    const jobData = {
      userId,
      amount,
      description,
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString(),
        source: 'queue'
      }
    };
    
    const job = await deductQueue.add(jobData, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000
      },
      removeOnComplete: 100,
      removeOnFail: 50
    });
    
    return {
      success: true,
      jobId: job.id,
      status: 'queued'
    };
  } catch (error) {
    throw error;
  }
}

// Функция для добавления задачи пополнения в очередь
async function queueAddTokens(userId, amount, description, metadata = {}) {
  try {
    const job = await addQueue.add({
      userId,
      amount,
      description,
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString(),
        source: 'queue'
      }
    }, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000
      },
      removeOnComplete: 100,
      removeOnFail: 50
    });
    
    return {
      success: true,
      jobId: job.id,
      status: 'queued'
    };
  } catch (error) {
    throw error;
  }
}

// Функция для получения статуса задачи
async function getJobStatus(jobId, queueType = 'deduct') {
  try {
    const queue = queueType === 'deduct' ? deductQueue : addQueue;
    const job = await queue.getJob(jobId);
    
    if (!job) {
      return { status: 'not_found' };
    }
    
    const state = await job.getState();
    const result = job.returnvalue;
    const failedReason = job.failedReason;
    
    return {
      jobId,
      status: state,
      result: state === 'completed' ? result : null,
      failedReason: state === 'failed' ? failedReason : null,
      progress: job.progress(),
      timestamp: job.timestamp
    };
  } catch (error) {
    throw error;
  }
}

// Функция для получения статистики очередей
async function getQueueStats() {
  try {
    const [deductStats, addStats] = await Promise.all([
      deductQueue.getJobCounts(),
      addQueue.getJobCounts()
    ]);
    
    return {
      deduct: {
        waiting: deductStats.waiting,
        active: deductStats.active,
        completed: deductStats.completed,
        failed: deductStats.failed,
        delayed: deductStats.delayed
      },
      add: {
        waiting: addStats.waiting,
        active: addStats.active,
        completed: addStats.completed,
        failed: addStats.failed,
        delayed: addStats.delayed
      },
      total: {
        waiting: deductStats.waiting + addStats.waiting,
        active: deductStats.active + addStats.active,
        completed: deductStats.completed + addStats.completed,
        failed: deductStats.failed + addStats.failed,
        delayed: deductStats.delayed + addStats.delayed
      }
    };
  } catch (error) {
    return {
      deduct: { waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0 },
      add: { waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0 },
      total: { waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0 }
    };
  }
}

// Функция для очистки старых задач
async function cleanOldJobs() {
  try {
    await Promise.all([
      deductQueue.clean(24 * 60 * 60 * 1000, 'completed'), // 24 часа
      deductQueue.clean(24 * 60 * 60 * 1000, 'failed'),
      addQueue.clean(24 * 60 * 60 * 1000, 'completed'),
      addQueue.clean(24 * 60 * 60 * 1000, 'failed')
    ]);
    
    return { success: true, message: 'Old jobs cleaned' };
  } catch (error) {
    throw error;
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  await Promise.all([
    deductQueue.close(),
    addQueue.close()
  ]);
  await redis.quit();
  process.exit(0);
});

module.exports = {
  queueDeductTokens,
  queueAddTokens,
  getJobStatus,
  getQueueStats,
  cleanOldJobs,
  deductQueue,
  addQueue,
  redis
}; 