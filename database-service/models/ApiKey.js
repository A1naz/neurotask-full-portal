const mongoose = require('mongoose');
const crypto = require('crypto');

const apiKeySchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  name: { 
    type: String, 
    required: true 
  }, // Название ключа (например "Мой бот")
  key: { 
    type: String, 
    required: true, 
    unique: true 
  }, // Хешированный API ключ
  permissions: {
    multiChat: { type: Boolean, default: true },
    assistant: { type: Boolean, default: true },
    readOnly: { type: Boolean, default: false }
  },
  rateLimit: {
    requestsPerMinute: { type: Number, default: 60 },
    requestsPerHour: { type: Number, default: 1000 }
  },
  isActive: { type: Boolean, default: true },
  lastUsed: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

// Индексы для оптимизации
apiKeySchema.index({ userId: 1 });
apiKeySchema.index({ key: 1 });
apiKeySchema.index({ isActive: 1 });

// Методы для работы с API ключами
apiKeySchema.statics.generateApiKey = function() {
  return 'sk_' + crypto.randomBytes(32).toString('hex');
};

apiKeySchema.statics.hashApiKey = function(key) {
  return crypto.createHash('sha256').update(key).digest('hex');
};

apiKeySchema.statics.createForUser = async function(userId, name, permissions = {}) {
  const plainKey = this.generateApiKey();
  const hashedKey = this.hashApiKey(plainKey);
  
  const apiKey = new this({
    userId,
    name,
    key: hashedKey,
    permissions: {
      multiChat: permissions.multiChat !== false,
      assistant: permissions.assistant !== false,
      readOnly: permissions.readOnly || false,
      ...permissions
    }
  });
  
  await apiKey.save();
  
  // Возвращаем только plain key один раз для показа пользователю
  return {
    ...apiKey.toObject(),
    plainKey // Только для первоначального показа
  };
};

// Метод для проверки активности ключа
apiKeySchema.methods.isValid = function() {
  return this.isActive;
};

// Метод для обновления времени последнего использования
apiKeySchema.methods.updateLastUsed = async function() {
  this.lastUsed = new Date();
  await this.save();
};

module.exports = mongoose.model('ApiKey', apiKeySchema);
