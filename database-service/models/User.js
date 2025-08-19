const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  balance: {
    type: Number,
    default: 0,
    min: 0
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  verificationCode: String,
  verificationExpires: Date,
  customSystemPrompt: {
    type: String,
    default: ''
  },
  lastLogin: Date,
  isActive: {
    type: Boolean,
    default: true
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'moderator'],
    default: 'user'
  },
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'auto'
    },
    language: {
      type: String,
      default: 'ru'
    },
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      push: {
        type: Boolean,
        default: true
      }
    },
    interface: {
      agentsExpanded: {
        type: Boolean,
        default: true
      },
      generationsExpanded: {
        type: Boolean,
        default: true
      }
    }
  },
  apiUsage: {
    totalRequests: {
      type: Number,
      default: 0
    },
    lastRequest: Date,
    dailyLimit: {
      type: Number,
      default: 1000
    },
    monthlyLimit: {
      type: Number,
      default: 30000
    }
  },
  // Поля для системы команд
  teamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    index: true
  },
  isTeamOwner: {
    type: Boolean,
    default: false
  },
  teamRole: {
    type: String,
    enum: ['owner', 'admin', 'manager', 'member', 'guest'],
    default: 'member'
  },
  // Поля для командной работы
  position: { type: String }, // Должность
  permissions: { type: [String], default: [] }, // Права доступа к разделам

  // Настройки AI
  aiSettings: {
    // ... existing code ...
  }
}, {
  timestamps: true
});

// Индексы для оптимизации запросов
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ balance: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ createdAt: -1 });
// Индексы для системы команд
userSchema.index({ teamId: 1 });
userSchema.index({ isTeamOwner: 1 });
userSchema.index({ teamRole: 1 });
userSchema.index({ teamId: 1, teamRole: 1 });

// Виртуальное поле для полного имени
userSchema.virtual('fullName').get(function() {
  return `${this.username}`;
});

// Middleware для хеширования пароля перед сохранением
userSchema.pre('save', async function(next) {
  // Хешируем пароль только если он был изменен
  if (!this.isModified('password')) return next();
  
  try {
    // Генерируем соль и хешируем пароль
    const saltRounds = 12;
    this.password = await bcrypt.hash(this.password, saltRounds);
    next();
  } catch (error) {
    next(error);
  }
});

// Middleware для хеширования пароля перед обновлением
userSchema.pre('findOneAndUpdate', async function(next) {
  const update = this.getUpdate();
  
  // Хешируем пароль только если он был изменен
  if (update.password) {
    try {
      const saltRounds = 12;
      update.password = await bcrypt.hash(update.password, saltRounds);
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// Метод для сравнения паролей
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Метод для проверки достаточности баланса
userSchema.methods.hasSufficientBalance = function(amount) {
  return this.balance >= amount;
};

// Метод для списания токенов
userSchema.methods.deductTokens = function(amount) {
  if (this.balance < amount) {
    throw new Error('Недостаточно токенов');
  }
  this.balance -= amount;
  return this.save();
};

// Метод для пополнения токенов
userSchema.methods.addTokens = function(amount) {
  this.balance += amount;
  return this.save();
};

// Метод для получения публичного профиля
userSchema.methods.getPublicProfile = function() {
  return {
    id: this._id,
    username: this.username,
    email: this.email,
    balance: this.balance,
    isEmailVerified: this.isEmailVerified,
    role: this.role,
    preferences: this.preferences,
    createdAt: this.createdAt
  };
};

// Статический метод для поиска по email
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

// Статический метод для поиска активных пользователей
userSchema.statics.findActive = function() {
  return this.find({ isActive: true });
};

// Методы для системы команд
userSchema.methods.getTeamInfo = function() {
  return {
    teamId: this.teamId,
    isTeamOwner: this.isTeamOwner,
    teamRole: this.teamRole
  };
};

userSchema.methods.setTeamRole = function(teamId, role, isOwner = false) {
  this.teamId = teamId;
  this.teamRole = role;
  this.isTeamOwner = isOwner;
  return this.save();
};

userSchema.methods.removeFromTeam = function() {
  this.teamId = undefined;
  this.teamRole = 'member';
  this.isTeamOwner = false;
  return this.save();
};

// Статический метод для поиска пользователей команды
userSchema.statics.findByTeam = function(teamId, options = {}) {
  const query = { teamId, isActive: true };
  
  if (options.role) {
    query.teamRole = options.role;
  }
  
  if (options.ownerOnly) {
    query.isTeamOwner = true;
  }
  
  return this.find(query)
    .select('username email teamRole isTeamOwner createdAt')
    .sort(options.sort || { createdAt: -1 });
};

// Статический метод для поиска владельцев команд
userSchema.statics.findTeamOwners = function() {
  return this.find({ isTeamOwner: true, isActive: true })
    .select('username email teamId teamRole')
    .populate('teamId', 'name description');
};

// Статический метод для получения статистики
userSchema.statics.getStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: null,
        totalUsers: { $sum: 1 },
        activeUsers: { $sum: { $cond: ['$isActive', 1, 0] } },
        verifiedUsers: { $sum: { $cond: ['$isEmailVerified', 1, 0] } },
        totalBalance: { $sum: '$balance' },
        avgBalance: { $avg: '$balance' }
      }
    }
  ]);
};

module.exports = mongoose.model('User', userSchema); 