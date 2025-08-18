const mongoose = require('mongoose');

const botChatHistorySchema = new mongoose.Schema({
  // ID бота
  botId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TelegramBot',
    required: true,
    index: true
  },
  
  // ID чата в Telegram
  chatId: {
    type: String,
    required: true,
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
  
  // Последняя активность
  lastActivity: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Индексы
botChatHistorySchema.index({ botId: 1, chatId: 1 });
botChatHistorySchema.index({ lastActivity: -1 });

// Метод для добавления сообщения
botChatHistorySchema.methods.addMessage = function(role, content) {
  console.log('🔍 Adding message:', role, content.substring(0, 100) + '...');
  this.messages.push({
    role,
    content,
    timestamp: new Date()
  });
  this.lastActivity = new Date();
  
  console.log('🔍 Message added, total messages:', this.messages.length);
  
  return this.save();
};

// Метод для очистки истории
botChatHistorySchema.methods.clearHistory = function() {
  this.messages = [];
  this.lastActivity = new Date();
  return this.save();
};

// Метод для получения контекста (последние N сообщений)
botChatHistorySchema.methods.getContext = function(limit = 10) {
  return this.messages.slice(-limit);
};

// Метод для получения контекста с учетом лимита токенов
botChatHistorySchema.methods.getContextWithTokenLimit = function(maxTokens = 4000) {
  let totalTokens = 0;
  const context = [];
  
  // Идем с конца массива (новые сообщения)
  for (let i = this.messages.length - 1; i >= 0; i--) {
    const message = this.messages[i];
    const estimatedTokens = Math.ceil(message.content.length / 4); // Примерная оценка токенов
    
    if (totalTokens + estimatedTokens > maxTokens) {
      break;
    }
    
    context.unshift(message); // Добавляем в начало
    totalTokens += estimatedTokens;
  }
  
  return context;
};

// Статический метод для поиска или создания истории чата
botChatHistorySchema.statics.getOrCreate = async function(botId, chatId) {
  // Сначала пытаемся найти существующую запись
  let chatHistory = await this.findOne({ botId, chatId });
  
  if (!chatHistory) {
    // Если записи нет, создаем новую
    chatHistory = new this({
      botId,
      chatId,
      messages: [],
      lastActivity: new Date()
    });
    await chatHistory.save();
    } else {
    // Если запись есть, обновляем lastActivity
    chatHistory.lastActivity = new Date();
    await chatHistory.save();
    }
  
  return chatHistory;
};

// Статический метод для поиска истории бота
botChatHistorySchema.statics.findByBot = function(botId) {
  return this.find({ botId }).sort({ lastActivity: -1 });
};

// Статический метод для поиска истории чата
botChatHistorySchema.statics.findByChat = function(chatId) {
  return this.find({ chatId }).sort({ lastActivity: -1 });
};

// Статический метод для очистки всей истории бота
botChatHistorySchema.statics.clearBotHistory = function(botId) {
  return this.updateMany(
    { botId },
    { 
      $set: { 
        messages: [],
        lastActivity: new Date()
      }
    }
  );
};

// Статический метод для очистки старой истории (старше X дней)
botChatHistorySchema.statics.clearOldHistory = function(daysOld = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  
  return this.deleteMany({
    lastActivity: { $lt: cutoffDate }
  });
};

// Статический метод для создания записи по умолчанию
botChatHistorySchema.statics.createDefault = function(botId, chatId) {
  return this.create({
    botId,
    chatId,
    messages: [],
    lastActivity: new Date()
  });
};

module.exports = mongoose.model('BotChatHistory', botChatHistorySchema); 