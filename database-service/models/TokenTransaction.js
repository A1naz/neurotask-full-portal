const mongoose = require('mongoose');

const tokenTransactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['top_up', 'spend', 'refund', 'bonus'],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    required: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'completed'
  },
  provider: {
    type: String,
    enum: ['manual', 'ai_request', 'telegram_bot', 'system'],
    default: 'manual'
  },
  referenceId: String, // Внешний ID для связи с другими системами
  balanceBefore: Number,
  balanceAfter: Number
}, {
  timestamps: true
});

// Индексы для оптимизации запросов
tokenTransactionSchema.index({ userId: 1, createdAt: -1 });
tokenTransactionSchema.index({ type: 1 });
tokenTransactionSchema.index({ status: 1 });
tokenTransactionSchema.index({ provider: 1 });
tokenTransactionSchema.index({ createdAt: -1 });

// Виртуальное поле для знака транзакции
tokenTransactionSchema.virtual('isCredit').get(function() {
  return this.type === 'top_up' || this.type === 'refund' || this.type === 'bonus';
});

// Виртуальное поле для знака транзакции
tokenTransactionSchema.virtual('isDebit').get(function() {
  return this.type === 'spend';
});

// Метод для получения деталей транзакции
tokenTransactionSchema.methods.getDetails = function() {
  return {
    id: this._id,
    userId: this.userId,
    type: this.type,
    amount: this.amount,
    description: this.description,
    status: this.status,
    provider: this.provider,
    balanceBefore: this.balanceBefore,
    balanceAfter: this.balanceAfter,
    metadata: this.metadata,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

// Статический метод для получения статистики пользователя
tokenTransactionSchema.statics.getUserStats = function(userId, period = '30d') {
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
  
  return this.aggregate([
    {
      $match: {
        userId: mongoose.Types.ObjectId(userId),
        createdAt: { $gte: startDate },
        status: 'completed'
      }
    },
    {
      $group: {
        _id: '$type',
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    }
  ]);
};

// Статический метод для получения общей статистики
tokenTransactionSchema.statics.getGlobalStats = function(period = '30d') {
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
  
  return this.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate },
        status: 'completed'
      }
    },
    {
      $group: {
        _id: {
          type: '$type',
          provider: '$provider'
        },
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: '$_id.type',
        providers: {
          $push: {
            provider: '$_id.provider',
            total: '$total',
            count: '$count'
          }
        },
        totalAmount: { $sum: '$total' },
        totalCount: { $sum: '$count' }
      }
    }
  ]);
};

// Статический метод для получения транзакций по провайдеру
tokenTransactionSchema.statics.getByProvider = function(provider, limit = 100) {
  return this.find({ provider })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('userId', 'username email');
};

// Статический метод для получения неудачных транзакций
tokenTransactionSchema.statics.getFailedTransactions = function(limit = 50) {
  return this.find({ status: 'failed' })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('userId', 'username email');
};

module.exports = mongoose.model('TokenTransaction', tokenTransactionSchema); 