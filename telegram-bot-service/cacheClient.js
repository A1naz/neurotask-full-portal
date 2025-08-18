const axios = require('axios');

class CacheClient {
  constructor() {
    this.baseURL = process.env.CACHE_SERVICE_URL || 'http://localhost:3013';
    this.apiKey = process.env.CACHE_SERVICE_API_KEY || 'your-super-secure-cache-service-api-key-here';
    
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey
      }
    });
  }

  // Получить данные из кэша
  async get(key) {
    try {
      const response = await this.client.get(`/api/get/${encodeURIComponent(key)}`);
      
      if (response.data.success && response.data.cached) {
        return response.data.data;
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }

  // Сохранить данные в кэш
  async set(key, data, ttl = 300) {
    try {
      const response = await this.client.post('/api/set', {
        key,
        data,
        ttl
      });
      
      return response.data.success;
    } catch (error) {
      return false;
    }
  }

  // Кэшировать настройки бота
  async cacheBotSettings(userId, settings, ttl = 1800) {
    return await this.set(`bot:${userId}`, settings, ttl);
  }

  // Получить настройки бота из кэша
  async getCachedBotSettings(userId) {
    return await this.get(`bot:${userId}`);
  }

  // Кэшировать системный промпт
  async cacheSystemPrompt(prompt, ttl = 3600) {
    return await this.set('system:prompt', prompt, ttl);
  }

  // Получить системный промпт из кэша
  async getCachedSystemPrompt() {
    return await this.get('system:prompt');
  }

  // Кэшировать AI настройки пользователя
  async cacheAISettings(userId, settings, ttl = 1800) {
    return await this.set(`ai:settings:${userId}`, settings, ttl);
  }

  // Получить AI настройки из кэша
  async getCachedAISettings(userId) {
    return await this.get(`ai:settings:${userId}`);
  }

  // Кэшировать AI ответ для Telegram
  async cacheTelegramAIResponse(userId, message, response, ttl = 300) {
    const key = `telegram:ai:${userId}:${this.hashMessage(message)}`;
    return await this.set(key, response, ttl);
  }

  // Получить AI ответ для Telegram из кэша
  async getCachedTelegramAIResponse(userId, message) {
    const key = `telegram:ai:${userId}:${this.hashMessage(message)}`;
    return await this.get(key);
  }

  // Кэшировать события календаря
  async cacheCalendarEvents(userId, events, ttl = 300) {
    return await this.set(`calendar:events:${userId}`, events, ttl);
  }

  // Получить события календаря из кэша
  async getCachedCalendarEvents(userId) {
    return await this.get(`calendar:events:${userId}`);
  }

  // Инвалидировать кэш бота
  async invalidateBotCache(userId) {
    const patterns = [
      `bot:${userId}`,
      `ai:settings:${userId}`,
      `telegram:ai:${userId}:*`,
      `calendar:events:${userId}`
    ];
    
    const results = [];
    for (const pattern of patterns) {
      try {
        const response = await this.client.get('/api/keys', {
          params: { pattern, limit: 100 }
        });
        
        if (response.data.keys.length > 0) {
          const deletePromises = response.data.keys.map(key => 
            this.client.delete(`/api/delete/${encodeURIComponent(key)}`)
          );
          await Promise.all(deletePromises);
          results.push(...response.data.keys);
        }
      } catch (error) {
        }
    }
    
    return results;
  }

  // Простой хеш для сообщений
  hashMessage(message) {
    let hash = 0;
    if (message.length === 0) return hash.toString();
    
    for (let i = 0; i < message.length; i++) {
      const char = message.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    return Math.abs(hash).toString();
  }

  // Проверить доступность кэш-сервиса
  async isAvailable() {
    try {
      const response = await this.client.get('/health', { timeout: 2000 });
      return response.data.status === 'healthy';
    } catch (error) {
      return false;
    }
  }
}

module.exports = CacheClient;
