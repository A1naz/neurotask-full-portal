const mongoose = require('mongoose');

const aiSettingsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Активные провайдеры
  activeProviders: {
    type: [String],
    default: []
  },
  
  // Провайдер по умолчанию
  defaultProvider: {
    type: String,
    default: ''
  },
  
  // 🔍 Выбранные провайдеры для мультичата
  selectedProviders: {
    type: [String],
    default: []
  },
  
  // Выбранные модели для каждого провайдера
  selectedModels: {
    type: Map,
    of: String,
    default: {}
  },

  // ID текущего активного чата
  currentChatId: {
    type: String,
    default: null,
    index: true
  }
}, {
  timestamps: true
});

// Индексы
aiSettingsSchema.index({ userId: 1 });
aiSettingsSchema.index({ 'usage.lastRequest': -1 });

// Метод для проверки активного провайдера
aiSettingsSchema.methods.isProviderActive = function(provider) {
  return this.activeProviders.includes(provider);
};

// Метод для добавления активного провайдера
aiSettingsSchema.methods.addActiveProvider = function(provider) {
  if (!this.activeProviders.includes(provider)) {
    this.activeProviders.push(provider);
  }
  return this.save();
};

// Метод для удаления активного провайдера
aiSettingsSchema.methods.removeActiveProvider = function(provider) {
  this.activeProviders = this.activeProviders.filter(p => p !== provider);
  return this.save();
};

// Метод для получения списка активных провайдеров
aiSettingsSchema.methods.getActiveProviders = function() {
  return this.activeProviders;
};

// Метод для установки провайдера по умолчанию
aiSettingsSchema.methods.setDefaultProvider = function(provider) {
  this.defaultProvider = provider;
  return this.save();
};

// 🔍 Метод для установки выбранных провайдеров
aiSettingsSchema.methods.setSelectedProviders = function(providers) {
  this.selectedProviders = providers;
  return this.save();
};

// 🔍 Метод для получения выбранных провайдеров
aiSettingsSchema.methods.getSelectedProviders = function() {
  return this.selectedProviders;
};

// Статический метод для поиска настроек пользователя
aiSettingsSchema.statics.findByUserId = function(userId) {
  return this.findOne({ userId });
};

// Статический метод для создания настроек по умолчанию
aiSettingsSchema.statics.createDefaultSettings = function(userId) {
  return new this({ userId, currentChatId: null });
};

module.exports = mongoose.model('AISettings', aiSettingsSchema); 