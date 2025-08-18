const mongoose = require('mongoose');

const notificationSettingsSchema = new mongoose.Schema({
  // Пользователь
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  
  // Общие настройки
  enabled: {
    type: Boolean,
    default: true
  },
  
  // Каналы уведомлений
  channels: {
    telegram: {
      enabled: {
        type: Boolean,
        default: true
      },
      chatId: String,
      botToken: String
    },
    email: {
      enabled: {
        type: Boolean,
        default: false
      },
      address: String
    },
    web: {
      enabled: {
        type: Boolean,
        default: true
      }
    },
    push: {
      enabled: {
        type: Boolean,
        default: false
      },
      endpoint: String,
      keys: {
        p256dh: String,
        auth: String
      }
    }
  },
  
  // Типы уведомлений
  notificationTypes: {
    dueDateReminder: {
      enabled: {
        type: Boolean,
        default: true
      },
      hoursBefore: {
        type: Number,
        default: 24,
        min: 1,
        max: 168 // 1 неделя
      }
    },
    overdueReminder: {
      enabled: {
        type: Boolean,
        default: true
      },
      hoursAfter: {
        type: Number,
        default: 12,
        min: 1,
        max: 168
      }
    },
    statusChange: {
      enabled: {
        type: Boolean,
        default: true
      }
    },
    assignment: {
      enabled: {
        type: Boolean,
        default: true
      }
    },
    comment: {
      enabled: {
        type: Boolean,
        default: true
      }
    },
    dailyDigest: {
      enabled: {
        type: Boolean,
        default: true
      },
      time: {
        type: String,
        default: '09:00'
      }
    },
    weeklyReport: {
      enabled: {
        type: Boolean,
        default: true
      },
      day: {
        type: String,
        enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
        default: 'monday'
      },
      time: {
        type: String,
        default: '10:00'
      }
    }
  },
  
  // Тихое время
  quietHours: {
    enabled: {
      type: Boolean,
      default: false
    },
    start: {
      type: String,
      default: '22:00'
    },
    end: {
      type: String,
      default: '08:00'
    },
    timezone: {
      type: String,
      default: 'Europe/Moscow'
    }
  },
  
  // Фильтры уведомлений
  filters: {
    // Минимальный приоритет для уведомлений
    minPriority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'low'
    },
    
    // Проекты для уведомлений (пустой массив = все проекты)
    projects: [{
      type: String,
      trim: true
    }],
    
    // Исключить собственные действия
    excludeOwnActions: {
      type: Boolean,
      default: true
    },
    
    // Исключить завершенные задачи
    excludeCompletedTasks: {
      type: Boolean,
      default: true
    }
  },
  
  // Настройки группировки
  grouping: {
    // Группировать уведомления по задачам
    groupByTask: {
      type: Boolean,
      default: true
    },
    
    // Максимальное количество уведомлений в группе
    maxGroupSize: {
      type: Number,
      default: 5,
      min: 1,
      max: 20
    },
    
    // Время жизни группы (минуты)
    groupLifetime: {
      type: Number,
      default: 30,
      min: 5,
      max: 1440 // 24 часа
    }
  },
  
  // Настройки доставки
  delivery: {
    // Максимальное количество уведомлений в день
    maxPerDay: {
      type: Number,
      default: 50,
      min: 1,
      max: 1000
    },
    
    // Интервал между уведомлениями (минуты)
    minInterval: {
      type: Number,
      default: 1,
      min: 0,
      max: 60
    },
    
    // Повторные попытки для неудачных уведомлений
    retryFailed: {
      type: Boolean,
      default: true
    },
    
    // Максимальное количество попыток
    maxRetries: {
      type: Number,
      default: 3,
      min: 1,
      max: 10
    }
  },
  
  // Шаблоны уведомлений
  templates: {
    dueDateReminder: {
      type: String,
      default: 'Напоминание: задача "{taskTitle}" должна быть выполнена {dueDate}'
    },
    overdueReminder: {
      type: String,
      default: 'Внимание: задача "{taskTitle}" просрочена на {overdueTime}'
    },
    statusChange: {
      type: String,
      default: 'Статус задачи "{taskTitle}" изменен на {newStatus}'
    },
    assignment: {
      type: String,
      default: 'Вам назначена задача "{taskTitle}"'
    },
    comment: {
      type: String,
      default: 'Новый комментарий в задаче "{taskTitle}": {commentPreview}'
    }
  }
}, {
  timestamps: true
});

// Индексы
notificationSettingsSchema.index({ userId: 1 });
notificationSettingsSchema.index({ 'channels.telegram.enabled': 1 });
notificationSettingsSchema.index({ 'channels.email.enabled': 1 });

// Виртуальное поле для проверки активных каналов
notificationSettingsSchema.virtual('activeChannels').get(function() {
  const channels = [];
  if (this.channels.telegram.enabled) channels.push('telegram');
  if (this.channels.email.enabled) channels.push('email');
  if (this.channels.web.enabled) channels.push('web');
  if (this.channels.push.enabled) channels.push('push');
  return channels;
});

// Виртуальное поле для проверки активных типов уведомлений
notificationSettingsSchema.virtual('activeNotificationTypes').get(function() {
  const types = [];
  if (this.notificationTypes.dueDateReminder.enabled) types.push('dueDateReminder');
  if (this.notificationTypes.overdueReminder.enabled) types.push('overdueReminder');
  if (this.notificationTypes.statusChange.enabled) types.push('statusChange');
  if (this.notificationTypes.assignment.enabled) types.push('assignment');
  if (this.notificationTypes.comment.enabled) types.push('comment');
  if (this.notificationTypes.dailyDigest.enabled) types.push('dailyDigest');
  if (this.notificationTypes.weeklyReport.enabled) types.push('weeklyReport');
  return types;
});

// Метод для проверки, можно ли отправлять уведомления в текущее время
notificationSettingsSchema.methods.canSendNotification = function() {
  if (!this.enabled) return false;
  
  // Проверка тихого времени
  if (this.quietHours.enabled) {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);
    
    if (this.quietHours.start <= this.quietHours.end) {
      // Обычный день (например, 08:00 - 22:00)
      if (currentTime >= this.quietHours.start && currentTime <= this.quietHours.end) {
        return true;
      }
    } else {
      // Переход через полночь (например, 22:00 - 08:00)
      if (currentTime >= this.quietHours.start || currentTime <= this.quietHours.end) {
        return true;
      }
    }
    return false;
  }
  
  return true;
};

// Метод для получения настроек по умолчанию
notificationSettingsSchema.statics.getDefaultSettings = function() {
  return {
    enabled: true,
    channels: {
      telegram: { enabled: true },
      email: { enabled: false },
      web: { enabled: true },
      push: { enabled: false }
    },
    notificationTypes: {
      dueDateReminder: { enabled: true, hoursBefore: 24 },
      overdueReminder: { enabled: true, hoursAfter: 12 },
      statusChange: { enabled: true },
      assignment: { enabled: true },
      comment: { enabled: true },
      dailyDigest: { enabled: true, time: '09:00' },
      weeklyReport: { enabled: true, day: 'monday', time: '10:00' }
    },
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00',
      timezone: 'Europe/Moscow'
    },
    filters: {
      minPriority: 'low',
      projects: [],
      excludeOwnActions: true,
      excludeCompletedTasks: true
    },
    grouping: {
      groupByTask: true,
      maxGroupSize: 5,
      groupLifetime: 30
    },
    delivery: {
      maxPerDay: 50,
      minInterval: 1,
      retryFailed: true,
      maxRetries: 3
    }
  };
};

// Метод для создания настроек по умолчанию для пользователя
notificationSettingsSchema.statics.createDefaultForUser = function(userId) {
  const defaultSettings = this.getDefaultSettings();
  return this.create({
    userId,
    ...defaultSettings
  });
};

// Middleware для валидации времени
notificationSettingsSchema.pre('save', function(next) {
  // Валидация времени тихого времени
  if (this.quietHours.enabled) {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(this.quietHours.start) || !timeRegex.test(this.quietHours.end)) {
      return next(new Error('Неверный формат времени для тихого времени'));
    }
  }
  
  // Валидация времени ежедневного дайджеста
  const digestTimeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  if (!digestTimeRegex.test(this.notificationTypes.dailyDigest.time)) {
    return next(new Error('Неверный формат времени для ежедневного дайджеста'));
  }
  
  // Валидация времени еженедельного отчета
  if (!digestTimeRegex.test(this.notificationTypes.weeklyReport.time)) {
    return next(new Error('Неверный формат времени для еженедельного отчета'));
  }
  
  next();
});

module.exports = mongoose.model('NotificationSettings', notificationSettingsSchema);
