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

  // Кэшировать AI ответ
  async cacheAIResponse(provider, message, response, ttl = 300) {
    const key = `ai:${provider}:${this.hashMessage(message)}`;
    return await this.set(key, response, ttl);
  }

  // Получить AI ответ из кэша
  async getCachedAIResponse(provider, message) {
    const key = `ai:${provider}:${this.hashMessage(message)}`;
    return await this.get(key);
  }

  // Кэшировать пользователя
  async cacheUser(userId, userData, ttl = 600) {
    return await this.set(`user:${userId}`, userData, ttl);
  }

  // Получить пользователя из кэша
  async getCachedUser(userId) {
    return await this.get(`user:${userId}`);
  }

  // Кэшировать баланс пользователя
  async cacheUserBalance(userId, balance, ttl = 300) {
    return await this.set(`balance:${userId}`, balance, ttl);
  }

  // Получить баланс пользователя из кэша
  async getCachedUserBalance(userId) {
    return await this.get(`balance:${userId}`);
  }

  // Кэшировать статистику
  async cacheStats(key, stats, ttl = 60) {
    return await this.set(`stats:${key}`, stats, ttl);
  }

  // Получить статистику из кэша
  async getCachedStats(key) {
    return await this.get(`stats:${key}`);
  }

  // Кэшировать историю чата
  async cacheChatHistory(userId, provider, messages, ttl = 1800) {
    const key = `chat:${userId}:${provider}`;
    return await this.set(key, messages, ttl);
  }

  // Получить историю чата из кэша
  async getCachedChatHistory(userId, provider) {
    const key = `chat:${userId}:${provider}`;
    return await this.get(key);
  }

  // Инвалидировать кэш пользователя
  async invalidateUserCache(userId) {
    const patterns = [
      `user:${userId}`,
      `balance:${userId}`,
      `stats:user:${userId}`,
      `chat:${userId}:*`
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

  // Инвалидировать кэш чата
  async invalidateChatCache(userId, provider = null) {
    const pattern = provider ? `chat:${userId}:${provider}` : `chat:${userId}:*`;
    try {
      const response = await this.client.get('/api/keys', {
        params: { pattern, limit: 100 }
      });
      
      if (response.data.keys.length > 0) {
        const deletePromises = response.data.keys.map(key => 
          this.client.delete(`/api/delete/${encodeURIComponent(key)}`)
        );
        await Promise.all(deletePromises);
        }
    } catch (error) {
      }
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
