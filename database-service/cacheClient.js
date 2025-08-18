const axios = require('axios');

class CacheClient {
  constructor() {
    this.baseURL = process.env.CACHE_SERVICE_URL || 'http://localhost:3013';
    this.apiKey = process.env.CACHE_SERVICE_API_KEY || 'cache-service-secure-api-key-2024';
    
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

  // Удалить данные из кэша
  async delete(key) {
    try {
      const response = await this.client.delete(`/api/delete/${encodeURIComponent(key)}`);
      return response.data.success;
    } catch (error) {
      return false;
    }
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

  // Инвалидировать кэш пользователя
  async invalidateUserCache(userId) {
    const patterns = [
      `user:${userId}`,
      `balance:${userId}`,
      `stats:user:${userId}`
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
