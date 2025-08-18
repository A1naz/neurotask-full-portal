const mongoose = require('mongoose');

const teamPermissionSchema = new mongoose.Schema({
  teamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true,
    index: true
  },
  role: {
    type: String,
    enum: ['owner', 'admin', 'manager', 'member', 'guest'],
    required: true
  },
  section: {
    type: String,
    required: true,
    enum: [
      'dashboard',
      'tasks',
      'bots',
      'ai-settings',
      'api-keys',
      'balance',
      'team-management',
      'generations',
      'agents',
      'calendar',
      'notifications',
      'user-settings',
      '*'
    ]
  },
  permissions: [{
    type: String,
    enum: ['read', 'write', 'delete', 'manage', 'invite', 'remove', '*'],
    required: true
  }],
  conditions: {
    // Условия для применения прав
    timeRestrictions: {
      startTime: String, // HH:MM
      endTime: String,   // HH:MM
      daysOfWeek: [Number] // 0-6 (воскресенье-суббота)
    },
    ipRestrictions: [String], // Разрешенные IP адреса
    deviceRestrictions: [String], // Разрешенные типы устройств
    customRules: [String] // Пользовательские правила
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  notes: {
    type: String,
    maxlength: 500
  }
}, {
  timestamps: true
});

// Индексы для оптимизации запросов
teamPermissionSchema.index({ teamId: 1, role: 1, section: 1 }, { unique: true });
teamPermissionSchema.index({ teamId: 1, section: 1 });
teamPermissionSchema.index({ role: 1, section: 1 });
teamPermissionSchema.index({ isActive: 1 });
teamPermissionSchema.index({ createdAt: -1 });

// Виртуальное поле для информации о команде
teamPermissionSchema.virtual('team', {
  ref: 'Team',
  localField: 'teamId',
  foreignField: '_id',
  justOne: true
});

// Виртуальное поле для информации о создателе
teamPermissionSchema.virtual('creator', {
  ref: 'User',
  localField: 'createdBy',
  foreignField: '_id',
  justOne: true
});

// Метод для проверки прав доступа
teamPermissionSchema.methods.hasPermission = function(permission) {
  if (this.permissions.includes('*')) return true;
  return this.permissions.includes(permission);
};

// Метод для проверки прав на раздел
teamPermissionSchema.methods.hasSectionAccess = function(section) {
  if (this.section === '*') return true;
  return this.section === section;
};

// Метод для проверки временных ограничений
teamPermissionSchema.methods.isTimeValid = function() {
  if (!this.conditions.timeRestrictions.startTime || !this.conditions.timeRestrictions.endTime) {
    return true; // Нет временных ограничений
  }
  
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  const startTime = this.conditions.timeRestrictions.startTime.split(':').map(Number);
  const endTime = this.conditions.timeRestrictions.endTime.split(':').map(Number);
  
  const startMinutes = startTime[0] * 60 + startTime[1];
  const endMinutes = endTime[0] * 60 + endTime[1];
  
  if (startMinutes <= endMinutes) {
    return currentTime >= startMinutes && currentTime <= endMinutes;
  } else {
    // Переход через полночь
    return currentTime >= startMinutes || currentTime <= endMinutes;
  }
};

// Метод для проверки дней недели
teamPermissionSchema.methods.isDayValid = function() {
  if (!this.conditions.timeRestrictions.daysOfWeek || this.conditions.timeRestrictions.daysOfWeek.length === 0) {
    return true; // Нет ограничений по дням
  }
  
  const currentDay = new Date().getDay();
  return this.conditions.timeRestrictions.daysOfWeek.includes(currentDay);
};

// Метод для проверки IP адреса
teamPermissionSchema.methods.isIpValid = function(ipAddress) {
  if (!this.conditions.ipRestrictions || this.conditions.ipRestrictions.length === 0) {
    return true; // Нет IP ограничений
  }
  
  return this.conditions.ipRestrictions.includes(ipAddress);
};

// Метод для получения полных прав
teamPermissionSchema.methods.getFullPermissions = function() {
  return {
    section: this.section,
    permissions: this.permissions,
    conditions: this.conditions,
    isActive: this.isActive
  };
};

// Статический метод для поиска прав команды
teamPermissionSchema.statics.findByTeam = function(teamId, options = {}) {
  const query = { teamId, isActive: true };
  
  if (options.role) {
    query.role = options.role;
  }
  
  if (options.section) {
    query.section = options.section;
  }
  
  return this.find(query)
    .populate('createdBy', 'username')
    .sort(options.sort || { role: 1, section: 1 });
};

// Статический метод для поиска прав по роли
teamPermissionSchema.statics.findByRole = function(role, options = {}) {
  const query = { role, isActive: true };
  
  if (options.section) {
    query.section = options.section;
  }
  
  return this.find(query)
    .populate('teamId', 'name')
    .populate('createdBy', 'username')
    .sort(options.sort || { section: 1 });
};

// Статический метод для получения прав пользователя в команде
teamPermissionSchema.statics.getUserPermissions = function(teamId, userId) {
  const TeamMember = this.model('TeamMember');
  
  return TeamMember.findOne({ teamId, userId, isActive: true })
    .then(member => {
      if (!member) return null;
      
      return this.find({ teamId, role: member.role, isActive: true })
        .populate('createdBy', 'username');
    });
};

// Статический метод для проверки прав доступа
teamPermissionSchema.statics.checkAccess = function(teamId, userId, section, permission) {
  const TeamMember = this.model('TeamMember');
  
  return TeamMember.findOne({ teamId, userId, isActive: true })
    .then(member => {
      if (!member) return false;
      
      return this.findOne({ teamId, role: member.role, section, isActive: true })
        .then(perm => {
          if (!perm) return false;
          
          return perm.hasPermission(permission);
        });
    });
};

// Статический метод для создания стандартных прав
teamPermissionSchema.statics.createDefaultPermissions = function(teamId, createdBy) {
  const defaultPermissions = [
    // Owner - полные права на все
    { teamId, role: 'owner', section: '*', permissions: ['*'], createdBy },
    
    // Admin - управление командой
    { teamId, role: 'admin', section: 'team-management', permissions: ['read', 'write', 'delete', 'manage'], createdBy },
    { teamId, role: 'admin', section: 'dashboard', permissions: ['read', 'write', 'manage'], createdBy },
    { teamId, role: 'admin', section: 'tasks', permissions: ['read', 'write', 'delete', 'manage'], createdBy },
    { teamId, role: 'admin', section: 'bots', permissions: ['read', 'write', 'delete', 'manage'], createdBy },
    { teamId, role: 'admin', section: 'ai-settings', permissions: ['read', 'write', 'manage'], createdBy },
    { teamId, role: 'admin', section: 'api-keys', permissions: ['read', 'write', 'delete'], createdBy },
    { teamId, role: 'admin', section: 'balance', permissions: ['read', 'write'], createdBy },
    { teamId, role: 'admin', section: 'generations', permissions: ['read', 'write', 'manage'], createdBy },
    { teamId, role: 'admin', section: 'agents', permissions: ['read', 'write', 'manage'], createdBy },
    
    // Manager - управление проектами
    { teamId, role: 'manager', section: 'dashboard', permissions: ['read', 'write'], createdBy },
    { teamId, role: 'manager', section: 'tasks', permissions: ['read', 'write', 'manage'], createdBy },
    { teamId, role: 'manager', section: 'bots', permissions: ['read', 'write'], createdBy },
    { teamId, role: 'manager', section: 'ai-settings', permissions: ['read', 'write'], createdBy },
    { teamId, role: 'manager', section: 'generations', permissions: ['read', 'write'], createdBy },
    { teamId, role: 'manager', section: 'agents', permissions: ['read', 'write'], createdBy },
    
    // Member - базовые права
    { teamId, role: 'member', section: 'dashboard', permissions: ['read'], createdBy },
    { teamId, role: 'member', section: 'tasks', permissions: ['read', 'write'], createdBy },
    { teamId, role: 'member', section: 'bots', permissions: ['read'], createdBy },
    { teamId, role: 'member', section: 'ai-settings', permissions: ['read'], createdBy },
    { teamId, role: 'member', section: 'generations', permissions: ['read', 'write'], createdBy },
    { teamId, role: 'member', section: 'agents', permissions: ['read'], createdBy },
    
    // Guest - ограниченные права
    { teamId, role: 'guest', section: 'dashboard', permissions: ['read'], createdBy },
    { teamId, role: 'guest', section: 'tasks', permissions: ['read'], createdBy },
    { teamId, role: 'guest', section: 'bots', permissions: ['read'], createdBy },
    { teamId, role: 'guest', section: 'generations', permissions: ['read'], createdBy }
  ];
  
  return this.insertMany(defaultPermissions);
};

// Middleware для проверки уникальности прав
teamPermissionSchema.pre('save', async function(next) {
  if (this.isNew || this.isModified('teamId') || this.isModified('role') || this.isModified('section')) {
    const existingPermission = await this.constructor.findOne({
      teamId: this.teamId,
      role: this.role,
      section: this.section,
      _id: { $ne: this._id }
    });
    
    if (existingPermission) {
      throw new Error('Permission already exists for this team, role and section');
    }
  }
  next();
});

// Middleware для проверки существования команды
teamPermissionSchema.pre('save', async function(next) {
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

module.exports = mongoose.model('TeamPermission', teamPermissionSchema);
