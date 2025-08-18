const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  settings: {
    maxMembers: {
      type: Number,
      default: 10,
      min: 1,
      max: 100
    },
    allowGuestAccess: {
      type: Boolean,
      default: false
    },
    defaultRole: {
      type: String,
      enum: ['member', 'guest'],
      default: 'member'
    },
    autoApproveInvitations: {
      type: Boolean,
      default: false
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  metadata: {
    industry: String,
    size: String,
    location: String,
    website: String
  }
}, {
  timestamps: true
});

// Индексы для оптимизации запросов
teamSchema.index({ name: 1 });
teamSchema.index({ ownerId: 1 });
teamSchema.index({ isActive: 1 });
teamSchema.index({ createdAt: -1 });
teamSchema.index({ 'settings.maxMembers': 1 });

// Виртуальное поле для количества участников
teamSchema.virtual('memberCount').get(function() {
  return this.model('TeamMember').countDocuments({ 
    teamId: this._id, 
    isActive: true 
  });
});

// Виртуальное поле для списка участников
teamSchema.virtual('members', {
  ref: 'TeamMember',
  localField: '_id',
  foreignField: 'teamId'
});

// Метод для проверки возможности добавления участника
teamSchema.methods.canAddMember = async function() {
  const memberCount = await this.model('TeamMember').countDocuments({ 
    teamId: this._id, 
    isActive: true 
  });
  return memberCount < this.settings.maxMembers;
};

// Метод для получения активных участников
teamSchema.methods.getActiveMembers = function() {
  return this.model('TeamMember').find({ 
    teamId: this._id, 
    isActive: true 
  }).populate('userId', 'username email');
};

// Метод для получения статистики команды
teamSchema.methods.getStats = async function() {
  const memberCount = await this.model('TeamMember').countDocuments({ 
    teamId: this._id, 
    isActive: true 
  });
  
  const roleDistribution = await this.model('TeamMember').aggregate([
    { $match: { teamId: this._id, isActive: true } },
    { $group: { _id: '$role', count: { $sum: 1 } } }
  ]);
  
  return {
    memberCount,
    roleDistribution,
    maxMembers: this.settings.maxMembers,
    isFull: memberCount >= this.settings.maxMembers
  };
};

// Статический метод для поиска команд по владельцу
teamSchema.statics.findByOwner = function(ownerId) {
  return this.find({ ownerId, isActive: true });
};

// Статический метод для поиска активных команд
teamSchema.statics.findActive = function() {
  return this.find({ isActive: true });
};

// Статический метод для получения статистики всех команд
teamSchema.statics.getGlobalStats = function() {
  return this.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: null,
        totalTeams: { $sum: 1 },
        totalMembers: { $sum: '$settings.maxMembers' },
        avgMaxMembers: { $avg: '$settings.maxMembers' }
      }
    }
  ]);
};

// Middleware для обновления updatedAt
teamSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Middleware для проверки уникальности имени команды для владельца
teamSchema.pre('save', async function(next) {
  if (this.isModified('name') || this.isNew) {
    const existingTeam = await this.constructor.findOne({
      name: this.name,
      ownerId: this.ownerId,
      _id: { $ne: this._id }
    });
    
    if (existingTeam) {
      throw new Error('Team name already exists for this owner');
    }
  }
  next();
});

module.exports = mongoose.model('Team', teamSchema);
