const mongoose = require('mongoose');

const teamMemberSchema = new mongoose.Schema({
  teamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  role: {
    type: String,
    enum: ['owner', 'admin', 'manager', 'member', 'guest'],
    default: 'member',
    required: true
  },
  permissions: [{
    type: String,
    enum: ['read', 'write', 'delete', 'manage', '*'],
    default: ['read']
  }],
  joinedAt: {
    type: Date,
    default: Date.now
  },
  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  settings: {
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      teamUpdates: { type: Boolean, default: true },
      taskUpdates: { type: Boolean, default: true }
    },
    preferences: {
      language: { type: String, default: 'ru' },
      timezone: { type: String, default: 'UTC' }
    }
  }
}, {
  timestamps: true
});

// Индексы для оптимизации запросов
teamMemberSchema.index({ teamId: 1, userId: 1 }, { unique: true });
teamMemberSchema.index({ teamId: 1, role: 1 });
teamMemberSchema.index({ userId: 1, isActive: 1 });
teamMemberSchema.index({ teamId: 1, isActive: 1 });
teamMemberSchema.index({ joinedAt: -1 });
teamMemberSchema.index({ lastActivity: -1 });

// Виртуальное поле для информации о пользователе
teamMemberSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

// Виртуальное поле для информации о команде
teamMemberSchema.virtual('team', {
  ref: 'Team',
  localField: 'teamId',
  foreignField: '_id',
  justOne: true
});

// Виртуальное поле для информации о пригласившем
teamMemberSchema.virtual('inviter', {
  ref: 'User',
  localField: 'invitedBy',
  foreignField: '_id',
  justOne: true
});

// Метод для проверки прав доступа
teamMemberSchema.methods.hasPermission = function(permission) {
  if (this.permissions.includes('*')) return true;
  return this.permissions.includes(permission);
};

// Метод для проверки роли
teamMemberSchema.methods.hasRole = function(role) {
  const roleHierarchy = {
    'owner': 5,
    'admin': 4,
    'manager': 3,
    'member': 2,
    'guest': 1
  };
  
  const userRoleLevel = roleHierarchy[this.role] || 0;
  const requiredRoleLevel = roleHierarchy[role] || 0;
  
  return userRoleLevel >= requiredRoleLevel;
};

// Метод для обновления активности
teamMemberSchema.methods.updateActivity = function() {
  this.lastActivity = new Date();
  return this.save();
};

// Метод для получения публичного профиля
teamMemberSchema.methods.getPublicProfile = function() {
  return {
    id: this._id,
    teamId: this.teamId,
    userId: this.userId,
    role: this.role,
    joinedAt: this.joinedAt,
    lastActivity: this.lastActivity,
    isActive: this.isActive
  };
};

// Статический метод для поиска участников команды
teamMemberSchema.statics.findByTeam = function(teamId, options = {}) {
  const query = { teamId, isActive: true };
  
  if (options.role) {
    query.role = options.role;
  }
  
  if (options.activeOnly !== false) {
    query.isActive = true;
  }
  
  return this.find(query)
    .populate('userId', 'username email')
    .populate('invitedBy', 'username')
    .sort(options.sort || { joinedAt: -1 });
};

// Статический метод для поиска команд пользователя
teamMemberSchema.statics.findByUser = function(userId, options = {}) {
  const query = { userId, isActive: true };
  
  if (options.role) {
    query.role = options.role;
  }
  
  return this.find(query)
    .populate('teamId', 'name description')
    .populate('invitedBy', 'username')
    .sort(options.sort || { joinedAt: -1 });
};

// Статический метод для проверки членства
teamMemberSchema.statics.isMember = function(teamId, userId) {
  return this.findOne({ teamId, userId, isActive: true });
};

// Статический метод для получения роли пользователя в команде
teamMemberSchema.statics.getUserRole = function(teamId, userId) {
  return this.findOne({ teamId, userId, isActive: true })
    .select('role permissions');
};

// Статический метод для получения статистики команды
teamMemberSchema.statics.getTeamStats = function(teamId) {
  return this.aggregate([
    { $match: { teamId: mongoose.Types.ObjectId(teamId), isActive: true } },
    {
      $group: {
        _id: '$role',
        count: { $sum: 1 },
        avgActivity: { $avg: { $dateDiff: { startDate: '$lastActivity', endDate: new Date(), unit: 'day' } } }
      }
    },
    { $sort: { count: -1 } }
  ]);
};

// Middleware для проверки уникальности участника в команде
teamMemberSchema.pre('save', async function(next) {
  if (this.isNew || this.isModified('teamId') || this.isModified('userId')) {
    const existingMember = await this.constructor.findOne({
      teamId: this.teamId,
      userId: this.userId,
      _id: { $ne: this._id }
    });
    
    if (existingMember) {
      throw new Error('User is already a member of this team');
    }
  }
  next();
});

// Middleware для проверки существования команды
teamMemberSchema.pre('save', async function(next) {
  if (this.isNew || this.isModified('teamId')) {
    const Team = this.model('Team');
    const team = await Team.findById(this.teamId);
    
    if (!team) {
      throw new Error('Team does not exist');
    }
    
    if (!team.isActive) {
      throw new Error('Team is not active');
    }
  }
  next();
});

// Middleware для проверки существования пользователя
teamMemberSchema.pre('save', async function(next) {
  if (this.isNew || this.isModified('userId')) {
    const User = this.model('User');
    const user = await User.findById(this.userId);
    
    if (!user) {
      throw new Error('User does not exist');
    }
    
    if (!user.isActive) {
      throw new Error('User is not active');
    }
  }
  next();
});

module.exports = mongoose.model('TeamMember', teamMemberSchema);
