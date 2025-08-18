const axios = require('axios');

class AIGatewayClient {
  constructor() {
    this.baseURL = process.env.AI_GATEWAY_URL || 'http://localhost:3004';
    this.apiKey = process.env.AI_GATEWAY_API_KEY;
    this.timeout = 30000;
  }

  async processAIRequest(userId, provider, message, options = {}) {
    try {
      const response = await axios.post(`${this.baseURL}/api/ai/process`, {
        userId,
        provider,
        message,
        options
      }, {
        timeout: this.timeout,
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey
        }
      });

      return {
        success: true,
        content: response.data.data.content,
        tokenCost: response.data.data.tokenCost,
        provider: response.data.provider,
        cached: response.data.data.cached || false
      };
    } catch (error) {
      if (error.response?.status === 503) {
        return {
          success: false,
          error: 'Service temporarily unavailable',
          code: 'SERVICE_UNAVAILABLE'
        };
      }

      if (error.response?.status === 429) {
        return {
          success: false,
          error: 'Rate limit exceeded',
          code: 'RATE_LIMIT_EXCEEDED'
        };
      }

      return {
        success: false,
        error: error.message || 'Unknown error',
        code: 'GATEWAY_ERROR'
      };
    }
  }

  async checkHealth() {
    try {
      const response = await axios.get(`${this.baseURL}/health`, {
        timeout: 5000
      });
      return {
        success: true,
        status: response.data.status,
        uptime: response.data.uptime
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getStats() {
    try {
      const response = await axios.get(`${this.baseURL}/api/stats`, {
        timeout: 5000,
        headers: {
          'X-API-Key': this.apiKey
        }
      });
      return {
        success: true,
        stats: response.data.stats
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = AIGatewayClient; 