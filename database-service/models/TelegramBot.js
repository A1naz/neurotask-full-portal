const mongoose = require('mongoose');

const telegramBotSchema = new mongoose.Schema({
  // Ссылка на пользователя (для совместимости со старой системой)
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false, // Не обязательно для новой системы
    index: true
  },
  
  // Основная информация о боте
  name: {
    type: String,
    required: false, // Делаем необязательным для совместимости
    trim: true,
    default: 'Telegram Bot'
  },
  
  // Основные поля бота (для совместимости)
  token: {
    type: String,
    required: false, // Делаем необязательным для совместимости
    unique: false // Убираем unique для совместимости
  },
  
  username: {
    type: String,
    required: false, // Делаем необязательным для совместимости
    unique: false // Убираем unique для совместимости
  },
  
  // Новые поля бота (основные)
  botToken: {
    type: String,
    required: true, // Токен обязателен для работы бота
    trim: true
  },
  
  botUsername: {
    type: String,
    required: false, // Username может быть сгенерирован
    trim: true
  },
  
  // Статус бота
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Настройки Google Calendar (из существующих данных)
  googleCalendarSettings: {
    clientId: {
      type: String,
      default: ''
    },
    clientSecret: {
      type: String,
      default: ''
    },
    refreshToken: {
      type: String,
      default: ''
    },
    accessToken: {
      type: String,
      default: ''
    },
    calendarId: {
      type: String,
      default: 'primary'
    }
  },
  
  // AI Provider (из существующих данных)
  aiProvider: {
    type: String,
    default: 'openai'
  },
  
  // Message Count (из существующих данных)
  messageCount: {
    type: Number,
    default: 0
  },
  
  // Activated At (из существующих данных)
  activatedAt: {
    type: Date,
    default: null
  },
  
  // Webhook URL (из существующих данных)
  webhookUrl: {
    type: String,
    default: ''
  },
  
  // Context settings (из существующих данных)
  contextEnabled: {
    type: Boolean,
    default: true
  },
  
  contextLimit: {
    type: Number,
    default: 30
  },
  
  // Integrations (из существующих данных)
  integrations: {
    googleCalendar: {
      enabled: {
        type: Boolean,
        default: true
      },
      settings: {
        clientId: {
          type: String,
          default: ''
        },
        clientSecret: {
          type: String,
          default: ''
        },
        refreshToken: {
          type: String,
          default: ''
        },
        accessToken: {
          type: String,
          default: ''
        },
        calendarId: {
          type: String,
          default: 'primary'
        }
      }
    }
  },
  
  // Last Activity (из существующих данных)
  lastActivity: {
    type: Date,
    default: Date.now
  },
  
  // Настройки бота (новые поля для будущего использования)
  settings: {
    welcomeMessage: {
      type: String,
      default: 'Добро пожаловать! Я AI-ассистент, готовый помочь вам с любыми вопросами.'
    },
    helpMessage: {
      type: String,
      default: 'Отправьте мне сообщение, и я постараюсь помочь вам!'
    },
    systemPrompt: {
      type: String,
      default: 'Ты полезный AI-ассистент. Отвечай на вопросы пользователя кратко и по делу.'
    },
    companyName: {
      type: String,
      default: ''
    },
    aiProvider: {
      type: String,
      default: 'openai'
    },
    contextEnabled: {
      type: Boolean,
      default: true
    },
    contextLimit: {
      type: Number,
      default: 30
    },
    maxTokensPerRequest: {
      type: Number,
      default: 1000
    },
    maxRequestsPerUser: {
      type: Number,
      default: 100
    },
    defaultProvider: {
      type: String,
      default: 'openai'
    },
    allowedProviders: {
      type: [String],
      default: ['openai', 'gemini', 'anthropic']
    }
  },
  
  // Настройки безопасности (новые поля для будущего использования)
  security: {
    requireAuthentication: {
      type: Boolean,
      default: false
    },
    allowedUsers: [{
      telegramId: Number,
      username: String,
      isAdmin: {
        type: Boolean,
        default: false
      }
    }],
    blockedUsers: [{
      telegramId: Number,
      username: String,
      reason: String,
      blockedAt: {
        type: Date,
        default: Date.now
      }
    }],
    rateLimit: {
      requestsPerMinute: {
        type: Number,
        default: 10
      },
      requestsPerHour: {
        type: Number,
        default: 100
      }
    }
  },
  
  // Настройки уведомлений (новые поля для будущего использования)
  notifications: {
    onUserJoin: {
      type: Boolean,
      default: true
    },
    onUserLeave: {
      type: Boolean,
      default: true
    },
    onError: {
      type: Boolean,
      default: true
    },
    adminChatId: String
  },
  
  // Статистика использования (новые поля для будущего использования)
  statistics: {
    totalUsers: {
      type: Number,
      default: 0
    },
    totalMessages: {
      type: Number,
      default: 0
    },
    totalTokens: {
      type: Number,
      default: 0
    },
    lastActivity: Date,
    dailyStats: [{
      date: Date,
      users: Number,
      messages: Number,
      tokens: Number
    }]
  },
  
  // Команды бота (новые поля для будущего использования)
  commands: [{
    command: String,
    description: String,
    isActive: {
      type: Boolean,
      default: true
    },
    handler: String // Путь к обработчику команды
  }],
  
  // Промпты для бота
  prompts: {
    system: {
      type: String,
      default: 'Ты помощник {company_name}, который помогает пользователям с их вопросами, а так же помогает создавать задачи и вести расписание через google календарь.'
    },
    custom: [{
      name: String,
      content: String,
      category: String,
      isActive: {
        type: Boolean,
        default: true
      }
    }]
  },
  
  // Название компании для персонализации промпта
  companyName: {
    type: String,
    default: 'Neurotask'
  },
  
  // Метаданные (новые поля для будущего использования)
  metadata: {
    createdBy: String,
    description: String,
    tags: [String],
    version: {
      type: String,
      default: '1.0.0'
    }
  }
}, {
  timestamps: true
});

// Индексы
telegramBotSchema.index({ userId: 1 });
telegramBotSchema.index({ isActive: 1 });
telegramBotSchema.index({ 'lastActivity': -1 });

// Метод для проверки активности бота
telegramBotSchema.methods.isBotActive = function() {
  return this.isActive;
};

// Метод для активации/деактивации бота
telegramBotSchema.methods.setActive = function(active) {
  this.isActive = active;
  return this.save();
};

// Метод для обновления последней активности
telegramBotSchema.methods.updateLastActivity = function() {
  this.lastActivity = new Date();
  return this.save();
};

// Метод для проверки разрешенного пользователя
telegramBotSchema.methods.isUserAllowed = function(telegramId) {
  if (!this.security.requireAuthentication) {
    return true;
  }
  
  // Проверяем, не заблокирован ли пользователь
  const isBlocked = this.security.blockedUsers.some(user => user.telegramId === telegramId);
  if (isBlocked) {
    return false;
  }
  
  // Проверяем, есть ли пользователь в списке разрешенных
  return this.security.allowedUsers.some(user => user.telegramId === telegramId);
};

// Метод для добавления разрешенного пользователя
telegramBotSchema.methods.addAllowedUser = function(telegramId, username, isAdmin = false) {
  const existingUser = this.security.allowedUsers.find(user => user.telegramId === telegramId);
  if (existingUser) {
    existingUser.username = username;
    existingUser.isAdmin = isAdmin;
  } else {
    this.security.allowedUsers.push({
      telegramId,
      username,
      isAdmin
    });
  }
  return this.save();
};

// Метод для блокировки пользователя
telegramBotSchema.methods.blockUser = function(telegramId, username, reason = '') {
  const existingBlock = this.security.blockedUsers.find(user => user.telegramId === telegramId);
  if (!existingBlock) {
    this.security.blockedUsers.push({
      telegramId,
      username,
      reason
    });
  }
  return this.save();
};

// Метод для разблокировки пользователя
telegramBotSchema.methods.unblockUser = function(telegramId) {
  this.security.blockedUsers = this.security.blockedUsers.filter(
    user => user.telegramId !== telegramId
  );
  return this.save();
};

// Метод для обновления статистики
telegramBotSchema.methods.updateStatistics = function(messageCount = 0, tokenCount = 0) {
  this.statistics.totalMessages += messageCount;
  this.statistics.totalTokens += tokenCount;
  this.statistics.lastActivity = new Date();
  return this.save();
};

// Метод для получения настроек провайдера
telegramBotSchema.methods.getProviderSettings = function(provider) {
  return {
    enabled: this.settings.allowedProviders.includes(provider),
    maxTokens: this.settings.maxTokensPerRequest,
    defaultProvider: this.settings.defaultProvider
  };
};

// Метод для добавления команды
telegramBotSchema.methods.addCommand = function(command, description, handler) {
  const existingCommand = this.commands.find(cmd => cmd.command === command);
  if (existingCommand) {
    existingCommand.description = description;
    existingCommand.handler = handler;
  } else {
    this.commands.push({
      command,
      description,
      handler,
      isActive: true
    });
  }
  return this.save();
};

// Метод для получения активных команд
telegramBotSchema.methods.getActiveCommands = function() {
  return this.commands.filter(cmd => cmd.isActive);
};

// Статический метод для поиска бота по токену
telegramBotSchema.statics.findByToken = function(token) {
  return this.findOne({ token });
};

// Статический метод для поиска активных ботов
telegramBotSchema.statics.findActive = function() {
  return this.find({ isActive: true });
};

// Статический метод для получения статистики всех ботов
telegramBotSchema.statics.getGlobalStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: null,
        totalBots: { $sum: 1 },
        activeBots: { $sum: { $cond: ['$isActive', 1, 0] } },
        totalUsers: { $sum: '$statistics.totalUsers' },
        totalMessages: { $sum: '$statistics.totalMessages' },
        totalTokens: { $sum: '$statistics.totalTokens' }
      }
    }
  ]);
};

module.exports = mongoose.model('TelegramBot', telegramBotSchema); 