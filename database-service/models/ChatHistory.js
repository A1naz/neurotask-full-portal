const mongoose = require('mongoose');

const chatHistorySchema = new mongoose.Schema({
  // ID пользователя
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // ID чата
  chatId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },

  // Заголовок чата
  chatTitle: {
    type: String,
    required: true,
  },

  // Провайдер AI
  provider: {
    type: String,
    required: true,
    enum: ['openai', 'gemini', 'anthropic', 'xai', 'yandexgpt', 'gigachat', 'mistral', 'cohere', 'huggingface', 'replicate', 'deepseek'],
    index: true
  },
  
  // Сообщения в чате
  messages: [{
    role: {
      type: String,
      enum: ['user', 'assistant', 'system'],
      required: true
    },
    content: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Системный промпт
  systemPrompt: {
    type: String,
    default: 'Ты полезный ассистент. Отвечай на вопросы пользователя кратко и по делу.'
  },
  
  // Последняя активность
  lastActivity: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Индексы
chatHistorySchema.index({ userId: 1, provider: 1 });
chatHistorySchema.index({ userId: 1, chatId: 1, provider: 1 }, { unique: true });
chatHistorySchema.index({ lastActivity: -1 });

// Метод для добавления сообщения
chatHistorySchema.methods.addMessage = function(role, content) {
  this.messages.push({
    role,
    content,
    timestamp: new Date()
  });
  this.lastActivity = new Date();
  return this.save();
};

// Метод для очистки истории
chatHistorySchema.methods.clearHistory = function() {
  this.messages = [];
  this.lastActivity = new Date();
  return this.save();
};

// Метод для получения контекста (последние N сообщений)
chatHistorySchema.methods.getContext = function(limit = 10) {
  return this.messages.slice(-limit);
};

// Статический метод для поиска или создания истории чата
chatHistorySchema.statics.getOrCreate = function(userId, provider, chatId, chatTitle) {
  return this.findOneAndUpdate(
    { userId, provider, chatId },
    { userId, provider, chatId, chatTitle },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};

// Статический метод для поиска истории пользователя
chatHistorySchema.statics.findByUser = function(userId) {
  return this.find({ userId }).sort({ lastActivity: -1 });
};

// Статический метод для поиска истории по провайдеру
chatHistorySchema.statics.findByProvider = function(provider) {
  return this.find({ provider }).sort({ lastActivity: -1 });
};

module.exports = mongoose.model('ChatHistory', chatHistorySchema); 