const express = require('express');
const router = express.Router();
const { requireApiKey } = require('../middleware/auth');
const Notification = require('../models/Notification');
const NotificationSettings = require('../models/NotificationSettings');
const mongoose = require('mongoose');

// ===== NOTIFICATION MANAGEMENT ENDPOINTS =====

// Получить уведомления пользователя
router.get('/:userId', requireApiKey, async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20, unreadOnly = false, type } = req.query;
    
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Неверный ID пользователя'
      });
    }

    const query = { userId };
    if (unreadOnly === 'true') query.readBy = { $ne: userId };
    if (type) query.type = type;

    const notifications = await Notification.find(query)
      .populate('senderId', 'username email firstName lastName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Notification.countDocuments(query);

    res.json({
      success: true,
      notifications,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Ошибка получения уведомлений'
    });
  }
});

// Создать уведомление
router.post('/', requireApiKey, async (req, res) => {
  try {
    const { userId, title, message, type = 'info', priority = 'normal', senderId, metadata = {} } = req.body;
    
    if (!userId || !title || !message) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'userId, title и message обязательны'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Неверный ID пользователя'
      });
    }

    if (senderId && !mongoose.Types.ObjectId.isValid(senderId)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Неверный ID отправителя'
      });
    }

    const notification = new Notification({
      userId,
      title,
      message,
      type,
      priority,
      senderId,
      metadata,
      createdAt: new Date(),
      readBy: []
    });

    await notification.save();

    res.status(201).json({
      success: true,
      message: 'Уведомление создано',
      notification: notification
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Ошибка создания уведомления'
    });
  }
});

// Отметить уведомление как прочитанное
router.patch('/:notificationId/read', requireApiKey, async (req, res) => {
  try {
    const { notificationId } = req.params;
    const { userId } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(notificationId) || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Неверные ID уведомления или пользователя'
      });
    }

    const notification = await Notification.findById(notificationId);
    
    if (!notification) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Уведомление не найдено'
      });
    }

    // Проверяем, что пользователь является получателем уведомления
    if (notification.userId.toString() !== userId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Недостаточно прав для отметки уведомления как прочитанного'
      });
    }

    // Добавляем пользователя в список прочитавших, если его там нет
    if (!notification.readBy.includes(userId)) {
      notification.readBy.push(userId);
      notification.readAt = new Date();
      await notification.save();
    }

    res.json({
      success: true,
      message: 'Уведомление отмечено как прочитанное',
      notification: notification
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Ошибка отметки уведомления как прочитанного'
    });
  }
});

// Отметить все уведомления пользователя как прочитанные
router.patch('/:userId/read-all', requireApiKey, async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Неверный ID пользователя'
      });
    }

    const result = await Notification.updateMany(
      { userId, readBy: { $ne: userId } },
      { 
        $addToSet: { readBy: userId },
        $set: { readAt: new Date() }
      }
    );

    res.json({
      success: true,
      message: 'Все уведомления отмечены как прочитанные',
      updatedCount: result.modifiedCount
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Ошибка отметки всех уведомлений как прочитанных'
    });
  }
});

// Удалить уведомление
router.delete('/:notificationId', requireApiKey, async (req, res) => {
  try {
    const { notificationId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Неверный ID уведомления'
      });
    }

    const notification = await Notification.findByIdAndDelete(notificationId);
    
    if (!notification) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Уведомление не найдено'
      });
    }

    res.json({
      success: true,
      message: 'Уведомление удалено'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Ошибка удаления уведомления'
    });
  }
});

// ===== NOTIFICATION SETTINGS ENDPOINTS =====

// Получить настройки уведомлений пользователя
router.get('/:userId/settings', requireApiKey, async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Неверный ID пользователя'
      });
    }

    let settings = await NotificationSettings.findOne({ userId });
    
    if (!settings) {
      // Создаем настройки по умолчанию
      settings = new NotificationSettings({
        userId,
        email: {
          enabled: true,
          types: ['important', 'task', 'team', 'system']
        },
        push: {
          enabled: true,
          types: ['important', 'task', 'team', 'system']
        },
        inApp: {
          enabled: true,
          types: ['important', 'task', 'team', 'system']
        },
        frequency: 'immediate',
        quietHours: {
          enabled: false,
          start: '22:00',
          end: '08:00'
        }
      });
      await settings.save();
    }

    res.json({
      success: true,
      settings: settings
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Ошибка получения настроек уведомлений'
    });
  }
});

// Обновить настройки уведомлений пользователя
router.put('/:userId/settings', requireApiKey, async (req, res) => {
  try {
    const { userId } = req.params;
    const updateData = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Неверный ID пользователя'
      });
    }

    const settings = await NotificationSettings.findOneAndUpdate(
      { userId },
      updateData,
      { new: true, upsert: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Настройки уведомлений обновлены',
      settings: settings
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Ошибка обновления настроек уведомлений'
    });
  }
});

// Сбросить настройки уведомлений пользователя по умолчанию
router.post('/:userId/settings/default', requireApiKey, async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Неверный ID пользователя'
      });
    }

    const defaultSettings = {
      userId,
      email: {
        enabled: true,
        types: ['important', 'task', 'team', 'system']
      },
      push: {
        enabled: true,
        types: ['important', 'task', 'team', 'system']
      },
      inApp: {
        enabled: true,
        types: ['important', 'task', 'team', 'system']
      },
      frequency: 'immediate',
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '08:00'
      }
    };

    const settings = await NotificationSettings.findOneAndUpdate(
      { userId },
      defaultSettings,
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      message: 'Настройки уведомлений сброшены по умолчанию',
      settings: settings
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Ошибка сброса настроек уведомлений'
    });
  }
});

// ===== NOTIFICATION STATISTICS ENDPOINTS =====

// Получить статистику уведомлений пользователя
router.get('/:userId/stats', requireApiKey, async (req, res) => {
  try {
    const { userId } = req.params;
    const { period = '30d' } = req.query;
    
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Неверный ID пользователя'
      });
    }

    // Вычисляем период для статистики
    const now = new Date();
    let startDate;
    
    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Получаем статистику по типам уведомлений
    const typeStats = await Notification.aggregate([
      {
        $match: {
          userId: mongoose.Types.ObjectId(userId),
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          readCount: {
            $sum: {
              $cond: [{ $in: [mongoose.Types.ObjectId(userId), '$readBy'] }, 1, 0]
            }
          }
        }
      }
    ]);

    // Общая статистика
    const totalNotifications = await Notification.countDocuments({
      userId,
      createdAt: { $gte: startDate }
    });

    const unreadNotifications = await Notification.countDocuments({
      userId,
      readBy: { $ne: userId },
      createdAt: { $gte: startDate }
    });

    const readNotifications = totalNotifications - unreadNotifications;

    // Статистика по приоритетам
    const priorityStats = await Notification.aggregate([
      {
        $match: {
          userId: mongoose.Types.ObjectId(userId),
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      }
    ]);

    const stats = {
      userId,
      period,
      total: totalNotifications,
      read: readNotifications,
      unread: unreadNotifications,
      readRate: totalNotifications > 0 ? (readNotifications / totalNotifications * 100).toFixed(2) : 0,
      byType: typeStats.reduce((acc, stat) => {
        acc[stat._id] = {
          total: stat.count,
          read: stat.readCount,
          unread: stat.count - stat.readCount
        };
        return acc;
      }, {}),
      byPriority: priorityStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {})
    };

    res.json({
      success: true,
      stats: stats
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Ошибка получения статистики уведомлений'
    });
  }
});

module.exports = router;
