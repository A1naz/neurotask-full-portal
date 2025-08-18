const axios = require('axios');

// Database Service configuration
const DATABASE_SERVICE_URL = process.env.DATABASE_SERVICE_URL || 'http://localhost:3012';
const DATABASE_SERVICE_API_KEY = process.env.DATABASE_SERVICE_API_KEY || 'database-service-secure-api-key-2024';

class MetricsService {
  constructor() {
    this.baseURL = DATABASE_SERVICE_URL;
    this.apiKey = DATABASE_SERVICE_API_KEY;
  }

  // Получить или создать метрики команды
  async getOrCreateTeamMetrics(teamId, date) {
    try {
      const response = await axios.get(`${this.baseURL}/api/team-metrics/${teamId}/date/${date.toISOString().split('T')[0]}`, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Обновить метрики команды
  async updateTeamMetrics(teamId, date, metricsData) {
    try {
      const response = await axios.put(`${this.baseURL}/api/team-metrics/${teamId}/date/${date.toISOString().split('T')[0]}`, metricsData, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Получить метрики команды за период
  async getTeamMetricsByDateRange(teamId, startDate, endDate) {
    try {
      const response = await axios.get(`${this.baseURL}/api/team-metrics/${teamId}/range`, {
        params: { startDate: startDate.toISOString(), endDate: endDate.toISOString() },
        headers: { 'Authorization': `Bearer ${this.apiKey}` }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Получить агрегированные метрики команды
  async getAggregatedTeamMetrics(teamId, startDate, endDate) {
    try {
      const response = await axios.get(`${this.baseURL}/api/team-metrics/${teamId}/aggregated`, {
        params: { startDate: startDate.toISOString(), endDate: endDate.toISOString() },
        headers: { 'Authorization': `Bearer ${this.apiKey}` }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Очистить старые метрики
  async cleanupOldMetrics(cutoffDate) {
    try {
      const response = await axios.delete(`${this.baseURL}/api/team-metrics/cleanup?cutoffDate=${cutoffDate.toISOString()}`, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Получить топ команд по активности
  async getTopTeamsByActivity(limit, startDate, endDate) {
    try {
      const response = await axios.get(`${this.baseURL}/api/team-metrics/top-teams`, {
        params: { limit, startDate: startDate.toISOString(), endDate: endDate.toISOString() },
        headers: { 'Authorization': `Bearer ${this.apiKey}` }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Получить количество задач за период
  async getTaskCountByDateRange(teamId, startDate, endDate, type) {
    try {
      const response = await axios.get(`${this.baseURL}/api/tasks/count/${teamId}/date-range`, {
        params: { startDate: startDate.toISOString(), endDate: endDate.toISOString(), type },
        headers: { 'Authorization': `Bearer ${this.apiKey}` }
      });
      return response.data.count;
    } catch (error) {
      return 0;
    }
  }

  // Получить количество задач по статусу
  async getTaskCountByStatus(teamId, status) {
    try {
      const response = await axios.get(`${this.baseURL}/api/tasks/count/${teamId}/status/${status}`, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` }
      });
      return response.data.count;
    } catch (error) {
      return 0;
    }
  }

  // Получить среднее время выполнения задач
  async getAverageTaskCompletionTime(teamId, startDate, endDate) {
    try {
      const response = await axios.get(`${this.baseURL}/api/tasks/average-completion-time/${teamId}`, {
        params: { startDate: startDate.toISOString(), endDate: endDate.toISOString() },
        headers: { 'Authorization': `Bearer ${this.apiKey}` }
      });
      return response.data.averageTime;
    } catch (error) {
      return 0;
    }
  }

  // Получить количество приглашений за период
  async getInvitationCountByDateRange(teamId, startDate, endDate) {
    try {
      const response = await axios.get(`${this.baseURL}/api/team-invitations/count/${teamId}/date-range`, {
        params: { startDate: startDate.toISOString(), endDate: endDate.toISOString() },
        headers: { 'Authorization': `Bearer ${this.apiKey}` }
      });
      return response.data.count;
    } catch (error) {
      return 0;
    }
  }

  // Получить количество приглашений по статусу
  async getInvitationCountByStatus(teamId, status, startDate, endDate) {
    try {
      let url = `${this.baseURL}/api/team-invitations/count/${teamId}/status/${status}`;
      if (startDate && endDate) {
        url += `?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`;
      }
      
      const response = await axios.get(url, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` }
      });
      return response.data.count;
    } catch (error) {
      return 0;
    }
  }

  // Получить количество уведомлений за период
  async getNotificationCountByDateRange(teamId, startDate, endDate) {
    try {
      const response = await axios.get(`${this.baseURL}/api/team-notifications/count/${teamId}/date-range`, {
        params: { startDate: startDate.toISOString(), endDate: endDate.toISOString() },
        headers: { 'Authorization': `Bearer ${this.apiKey}` }
      });
      return response.data.count;
    } catch (error) {
      return 0;
    }
  }

  // Получить количество уведомлений по статусу
  async getNotificationCountByStatus(teamId, status, startDate, endDate) {
    try {
      let url = `${this.baseURL}/api/team-notifications/count/${teamId}/status/${status}`;
      if (startDate && endDate) {
        url += `?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`;
      }
      
      const response = await axios.get(url, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` }
      });
      return response.data.count;
    } catch (error) {
      return 0;
    }
  }

  // Получить количество активных ботов
  async getActiveBotCount(teamId) {
    try {
      const response = await axios.get(`${this.baseURL}/api/telegram-bots/count/${teamId}/active`, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` }
      });
      return response.data.count;
    } catch (error) {
      return 0;
    }
  }

  // Получить количество AI запросов
  async getAIRequestCount(teamId, startDate, endDate) {
    try {
      const response = await axios.get(`${this.baseURL}/api/ai-requests/count/${teamId}`, {
        params: { startDate: startDate.toISOString(), endDate: endDate.toISOString() },
        headers: { 'Authorization': `Bearer ${this.apiKey}` }
      });
      return response.data.count;
    } catch (error) {
      return 0;
    }
  }

  // Получить среднее время ответа AI
  async getAverageAIResponseTime(teamId, startDate, endDate) {
    try {
      const response = await axios.get(`${this.baseURL}/api/ai-requests/average-response-time/${teamId}`, {
        params: { startDate: startDate.toISOString(), endDate: endDate.toISOString() },
        headers: { 'Authorization': `Bearer ${this.apiKey}` }
      });
      return response.data.averageTime;
    } catch (error) {
      return 0;
    }
  }

  // Получить баланс команды
  async getTeamBalance(teamId) {
    try {
      const response = await axios.get(`${this.baseURL}/api/teams/${teamId}/balance`, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` }
      });
      return response.data.balance;
    } catch (error) {
      return 0;
    }
  }

  // Получить количество транзакций
  async getTransactionCount(teamId, startDate, endDate) {
    try {
      const response = await axios.get(`${this.baseURL}/api/transactions/count/${teamId}`, {
        params: { startDate: startDate.toISOString(), endDate: endDate.toISOString() },
        headers: { 'Authorization': `Bearer ${this.apiKey}` }
      });
      return response.data.count;
    } catch (error) {
      return 0;
    }
  }

  // Получить сумму транзакций
  async getTransactionAmount(teamId, startDate, endDate) {
    try {
      const response = await axios.get(`${this.baseURL}/api/transactions/amount/${teamId}`, {
        params: { startDate: startDate.toISOString(), endDate: endDate.toISOString() },
        headers: { 'Authorization': `Bearer ${this.apiKey}` }
      });
      return response.data.amount;
    } catch (error) {
      return 0;
    }
  }

  // Получить все команды
  async getAllTeams() {
    try {
      const response = await axios.get(`${this.baseURL}/api/teams`, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` }
      });
      return response.data;
    } catch (error) {
      return [];
    }
  }

  // Получить количество участников команды
  async getTeamMemberCount(teamId, isActive = true) {
    try {
      const response = await axios.get(`${this.baseURL}/api/team-members/count/${teamId}`, {
        params: { isActive },
        headers: { 'Authorization': `Bearer ${this.apiKey}` }
      });
      return response.data.count;
    } catch (error) {
      return 0;
    }
  }

  // Получить количество активных участников команды
  async getActiveTeamMemberCount(teamId, startDate, endDate) {
    try {
      const response = await axios.get(`${this.baseURL}/api/team-members/count/${teamId}/active`, {
        params: { startDate: startDate.toISOString(), endDate: endDate.toISOString() },
        headers: { 'Authorization': `Bearer ${this.apiKey}` }
      });
      return response.data.count;
    } catch (error) {
      return 0;
    }
  }

  // Обновить метрики команды
  async updateTeamMetricsData(teamId, date, data) {
    try {
      const metrics = await this.getOrCreateTeamMetrics(teamId, date);
      
      // Обновляем метрики
      const updatedMetrics = {
        ...metrics,
        ...data,
        lastUpdated: new Date()
      };

      return await this.updateTeamMetrics(teamId, date, updatedMetrics);
    } catch (error) {
      throw error;
    }
  }

  // Получить полную статистику команды
  async getFullTeamStats(teamId, startDate, endDate) {
    try {
      const [
        metrics,
        taskCount,
        invitationCount,
        notificationCount,
        botCount,
        aiRequestCount,
        balance,
        transactionCount
      ] = await Promise.all([
        this.getAggregatedTeamMetrics(teamId, startDate, endDate),
        this.getTaskCountByDateRange(teamId, startDate, endDate, 'all'),
        this.getInvitationCountByDateRange(teamId, startDate, endDate),
        this.getNotificationCountByDateRange(teamId, startDate, endDate),
        this.getActiveBotCount(teamId),
        this.getAIRequestCount(teamId, startDate, endDate),
        this.getTeamBalance(teamId),
        this.getTransactionCount(teamId, startDate, endDate)
      ]);

      return {
        teamId,
        period: { startDate, endDate },
        metrics,
        tasks: { total: taskCount },
        invitations: { total: invitationCount },
        notifications: { total: notificationCount },
        bots: { active: botCount },
        ai: { requests: aiRequestCount },
        financial: { balance, transactions: transactionCount }
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = MetricsService;
