const mongoose = require('mongoose');

const projectSettingsSchema = new mongoose.Schema({
  // ID настроек
  settingsId: {
    type: String,
    default: 'global',
    unique: true
  },
  
  // API Keys для различных провайдеров
  aiApiKeys: {
    openai: {
      type: String,
      default: ''
    },
    gemini: {
      type: String,
      default: ''
    },
    anthropic: {
      type: String,
      default: ''
    },
    xai: {
      type: String,
      default: ''
    },
    deepseek: {
      type: String,
      default: ''
    },
    gigachat: {
      type: String,
      default: ''
    },
    yandexgpt: {
      type: String,
      default: ''
    },
    mistral: {
      type: String,
      default: ''
    },
    cohere: {
      type: String,
      default: ''
    },
    huggingface: {
      type: String,
      default: ''
    },
    replicate: {
      type: String,
      default: ''
    }
  },
  
  // Настройки проекта
  projectSettings: {
    maxTokens: {
      type: Number,
      default: 4000
    },
    temperature: {
      type: Number,
      default: 0.7
    },
    autoSave: {
      type: Boolean,
      default: true
    }
  },
  
  // Настройки безопасности
  security: {
    sessionTimeout: {
      type: Number,
      default: 24 * 60 * 60 * 1000 // 24 часа в миллисекундах
    },
    maxLoginAttempts: {
      type: Number,
      default: 5
    },
    lockoutDuration: {
      type: Number,
      default: 15 * 60 * 1000 // 15 минут
    },
    requireEmailVerification: {
      type: Boolean,
      default: true
    },
    requireStrongPassword: {
      type: Boolean,
      default: true
    },
    minPasswordLength: {
      type: Number,
      default: 8
    }
  },
  
  // Настройки уведомлений
  notifications: {
    email: {
      enabled: {
        type: Boolean,
        default: true
      },
      smtp: {
        host: String,
        port: Number,
        secure: Boolean,
        user: String,
        pass: String
      },
      templates: {
        welcome: String,
        verification: String,
        resetPassword: String
      }
    },
    telegram: {
      enabled: {
        type: Boolean,
        default: false
      },
      botToken: String,
      chatId: String
    }
  },
  
  // Настройки платежей
  payments: {
    enabled: {
      type: Boolean,
      default: false
    },
    currency: {
      type: String,
      default: 'RUB'
    },
    tokenPrice: {
      type: Number,
      default: 1.0
    },
    minPurchase: {
      type: Number,
      default: 100
    },
    maxPurchase: {
      type: Number,
      default: 10000
    }
  },
  
  // Настройки аналитики
  analytics: {
    enabled: {
      type: Boolean,
      default: true
    },
    trackUserBehavior: {
      type: Boolean,
      default: true
    },
    trackErrors: {
      type: Boolean,
      default: true
    },
    retentionDays: {
      type: Number,
      default: 90
    }
  }
}, {
  timestamps: true
});

// Статический метод для получения глобальных настроек
projectSettingsSchema.statics.getGlobalSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = new this();
    await settings.save();
  }
  return settings;
};

// Статический метод для обновления глобальных настроек
projectSettingsSchema.statics.updateGlobalSettings = async function(updates) {
  let settings = await this.findOne();
  if (!settings) {
    settings = new this();
  }
  
  // Рекурсивно обновляем настройки
  const updateNested = (obj, updates) => {
    for (const [key, value] of Object.entries(updates)) {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        if (!obj[key]) obj[key] = {};
        updateNested(obj[key], value);
      } else {
        obj[key] = value;
      }
    }
  };
  
  updateNested(settings, updates);
  await settings.save();
  return settings;
};

// Метод для получения API ключа провайдера
projectSettingsSchema.methods.getApiKey = function(provider) {
  return this.aiApiKeys[provider] || '';
};

// Метод для установки API ключа провайдера
projectSettingsSchema.methods.setApiKey = function(provider, key) {
  this.aiApiKeys[provider] = key;
  return this.save();
};

// Метод для проверки доступности провайдера
projectSettingsSchema.methods.isProviderAvailable = function(provider) {
  return !!this.aiApiKeys[provider];
};

// Метод для получения списка доступных провайдеров
projectSettingsSchema.methods.getAvailableProviders = function() {
  return Object.keys(this.aiApiKeys).filter(provider => this.aiApiKeys[provider]);
};

// Метод для получения настроек безопасности
projectSettingsSchema.methods.getSecuritySettings = function() {
  return this.security;
};

// Метод для получения настроек приложения
projectSettingsSchema.methods.getAppSettings = function() {
  return this.appSettings;
};

// Метод для проверки режима обслуживания
projectSettingsSchema.methods.isMaintenanceMode = function() {
  return this.appSettings.maintenance;
};

// Метод для включения/выключения режима обслуживания
projectSettingsSchema.methods.setMaintenanceMode = function(enabled, message = '') {
  this.appSettings.maintenance = enabled;
  if (message) {
    this.appSettings.maintenanceMessage = message;
  }
  return this.save();
};

module.exports = mongoose.model('ProjectSettings', projectSettingsSchema); 