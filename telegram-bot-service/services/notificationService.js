const axios = require('axios');

// Database Service configuration
const DATABASE_SERVICE_URL = process.env.DATABASE_SERVICE_URL || 'http://localhost:3012';
const DATABASE_SERVICE_API_KEY = process.env.DATABASE_SERVICE_API_KEY || 'database-service-secure-api-key-2024';

class NotificationService {
  constructor() {
    this.baseURL = DATABASE_SERVICE_URL;
    this.apiKey = DATABASE_SERVICE_API_KEY;
  }

  // Создать уведомление
  async createNotification(notificationData) {
    try {
      const response = await axios.post(`${this.baseURL}/api/team-notifications`, notificationData, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Создать несколько уведомлений
  async createBulkNotifications(notificationsData) {
    try {
      const response = await axios.post(`${this.baseURL}/api/team-notifications/bulk`, notificationsData, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Получить уведомления пользователя
  async getUserNotifications(userId, options = {}) {
    try {
      const { teamId, limit = 50, offset = 0, unreadOnly = false, type = null } = options;
      let url = `${this.baseURL}/api/team-notifications/user/${userId}?limit=${limit}&offset=${offset}`;
      
      if (teamId) url += `&teamId=${teamId}`;
      if (unreadOnly) url += '&unreadOnly=true';
      if (type) url += `&type=${type}`;
      
      const response = await axios.get(url, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Получить количество непрочитанных уведомлений
  async getUnreadNotificationCount(userId, teamId = null) {
    try {
      let url = `${this.baseURL}/api/team-notifications/user/${userId}/unread-count`;
      if (teamId) url += `?teamId=${teamId}`;
      
      const response = await axios.get(url, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` }
      });
      return response.data.count;
    } catch (error) {
      throw error;
    }
  }

  // Отметить уведомление как прочитанное
  async markNotificationAsRead(notificationId) {
    try {
      const response = await axios.put(`${this.baseURL}/api/team-notifications/${notificationId}`, {
        isRead: true,
        readAt: new Date()
      }, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Отметить все уведомления как прочитанные
  async markAllNotificationsAsRead(userId, teamId = null) {
    try {
      let url = `${this.baseURL}/api/team-notifications/user/${userId}/mark-all-read`;
      if (teamId) url += `?teamId=${teamId}`;
      
      const response = await axios.put(url, {}, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Архивировать уведомление
  async archiveNotification(notificationId) {
    try {
      const response = await axios.put(`${this.baseURL}/api/team-notifications/${notificationId}`, {
        isArchived: true,
        archivedAt: new Date()
      }, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Очистить старые уведомления
  async cleanupOldNotifications(cutoffDate) {
    try {
      const response = await axios.delete(`${this.baseURL}/api/team-notifications/cleanup?cutoffDate=${cutoffDate.toISOString()}`, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Получить уведомление по ID
  async getNotificationById(notificationId) {
    try {
      const response = await axios.get(`${this.baseURL}/api/team-notifications/${notificationId}`, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Удалить уведомление
  async deleteNotification(notificationId) {
    try {
      const response = await axios.delete(`${this.baseURL}/api/team-notifications/${notificationId}`, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Получить статистику уведомлений
  async getNotificationStats(userId, teamId = null) {
    try {
      let url = `${this.baseURL}/api/team-notifications/stats/${userId}`;
      if (teamId) url += `?teamId=${teamId}`;
      
      const response = await axios.get(url, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Получить настройки уведомлений
  async getNotificationSettings(userId) {
    try {
      const response = await axios.get(`${this.baseURL}/api/team-notifications/settings/${userId}`, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Обновить настройки уведомлений
  async updateNotificationSettings(userId, settings) {
    try {
      const response = await axios.put(`${this.baseURL}/api/team-notifications/settings/${userId}`, settings, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Отправить уведомление всем участникам команды
  async notifyTeamMembers(teamId, notificationData, excludeUserId = null) {
    try {
      // Получаем всех участников команды
      const membersResponse = await axios.get(`${this.baseURL}/api/team-members/team/${teamId}?isActive=true`, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` }
      });
      
      const members = membersResponse.data;
      const notifications = [];

      for (const member of members) {
        if (excludeUserId && member.userId.toString() === excludeUserId.toString()) {
          continue;
        }

        notifications.push({
          ...notificationData,
          userId: member.userId,
          teamId: teamId
        });
      }

      if (notifications.length > 0) {
        return await this.createBulkNotifications(notifications);
      }

      return { success: true, count: 0 };
    } catch (error) {
      throw error;
    }
  }

  // Отправить системное уведомление
  async sendSystemNotification(userId, title, message, type = 'system', metadata = {}) {
    try {
      const notificationData = {
        userId,
        title,
        message,
        type,
        isSystem: true,
        metadata
      };

      return await this.createNotification(notificationData);
    } catch (error) {
      throw error;
    }
  }
}

module.exports = NotificationService;
