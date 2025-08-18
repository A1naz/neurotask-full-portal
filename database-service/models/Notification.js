const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  // Получатель уведомления
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Тип уведомления
  type: {
    type: String,
    enum: ['due_date', 'overdue', 'status_change', 'assignment', 'comment', 'daily_digest', 'weekly_report'],
    required: true
  },
  
  // Задача, к которой относится уведомление
  task: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  },
  
  // Заголовок уведомления
  title: {
    type: String,
    required: true
  },
  
  // Содержание уведомления
  message: {
    type: String,
    required: true
  },
  
  // Статус отправки
  status: {
    type: String,
    enum: ['pending', 'sent', 'failed', 'delivered'],
    default: 'pending'
  },
  
  // Каналы отправки
  channels: [{
    type: String,
    enum: ['telegram', 'email', 'web', 'push'],
    required: true
  }],
  
  // Метаданные для разных каналов
  metadata: {
    telegram: {
      chatId: String,
      messageId: String,
      sentAt: Date
    },
    email: {
      messageId: String,
      sentAt: Date,
      openedAt: Date
    },
    web: {
      readAt: Date,
      clickedAt: Date
    }
  },
  
  // Приоритет уведомления
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  
  // Время отправки (для отложенных уведомлений)
  scheduledFor: {
    type: Date
  },
  
  // Время отправки
  sentAt: {
    type: Date
  },
  
  // Время прочтения
  readAt: {
    type: Date
  },
  
  // Количество попыток отправки
  retryCount: {
    type: Number,
    default: 0
  },
  
  // Максимальное количество попыток
  maxRetries: {
    type: Number,
    default: 3
  },
  
  // Ошибки отправки
  errors: [{
    message: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    channel: String
  }],
  
  // Настройки уведомлений пользователя на момент отправки
  userSettings: {
    telegramEnabled: Boolean,
    emailEnabled: Boolean,
    webEnabled: Boolean,
    quietHours: {
      enabled: Boolean,
      start: String,
      end: String
    }
  }
}, {
  timestamps: true
});

// Индексы для быстрого поиска
notificationSchema.index({ recipient: 1, status: 1 });
notificationSchema.index({ type: 1, status: 1 });
notificationSchema.index({ scheduledFor: 1, status: 1 });
notificationSchema.index({ task: 1, type: 1 });
notificationSchema.index({ createdAt: -1 });

// Виртуальное поле для проверки просроченности
notificationSchema.virtual('isOverdue').get(function() {
  if (this.scheduledFor && this.status === 'pending') {
    return new Date() > this.scheduledFor;
  }
  return false;
});

// Виртуальное поле для проверки возможности повторной отправки
notificationSchema.virtual('canRetry').get(function() {
  return this.status === 'failed' && this.retryCount < this.maxRetries;
});

// Метод для отметки уведомления как прочитанного
notificationSchema.methods.markAsRead = function() {
  this.readAt = new Date();
  return this.save();
};

// Метод для отметки уведомления как отправленного
notificationSchema.methods.markAsSent = function(channel = 'telegram') {
  this.status = 'sent';
  this.sentAt = new Date();
  
  if (!this.metadata[channel]) {
    this.metadata[channel] = {};
  }
  this.metadata[channel].sentAt = new Date();
  
  return this.save();
};

// Метод для отметки уведомления как неудачного
notificationSchema.methods.markAsFailed = function(error, channel = 'telegram') {
  this.status = 'failed';
  this.retryCount += 1;
  
  this.errors.push({
    message: error.message || error,
    channel,
    timestamp: new Date()
  });
  
  return this.save();
};

// Статический метод для поиска уведомлений по фильтрам
notificationSchema.statics.findByFilters = function(filters = {}) {
  const query = {};
  
  if (filters.recipient) query.recipient = filters.recipient;
  if (filters.type) query.type = filters.type;
  if (filters.status) query.status = filters.status;
  if (filters.task) query.task = filters.task;
  if (filters.priority) query.priority = filters.priority;
  if (filters.channels) query.channels = { $in: filters.channels };
  if (filters.isOverdue) {
    query.scheduledFor = { $lt: new Date() };
    query.status = 'pending';
  }
  
  return this.find(query)
    .populate('recipient', 'username email')
    .populate('task', 'title status priority')
    .sort({ createdAt: -1 });
};

// Статический метод для получения статистики уведомлений
notificationSchema.statics.getStats = function(userId = null) {
  const match = userId ? { recipient: userId } : {};
  
  return this.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        types: { $addToSet: '$type' }
      }
    }
  ]);
};

// Статический метод для получения уведомлений для отправки
notificationSchema.statics.getPendingNotifications = function() {
  const now = new Date();
  
  return this.find({
    $or: [
      { scheduledFor: { $lte: now } },
      { scheduledFor: { $exists: false } }
    ],
    status: 'pending',
    retryCount: { $lt: '$maxRetries' }
  }).populate('recipient', 'username email telegramChatId')
    .populate('task', 'title status priority dueDate');
};

// Middleware для автоматического обновления статуса
notificationSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'sent') {
    this.sentAt = new Date();
  }
  next();
});

module.exports = mongoose.model('Notification', notificationSchema);
