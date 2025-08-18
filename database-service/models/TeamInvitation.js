const mongoose = require('mongoose');

const teamInvitationSchema = new mongoose.Schema({
  teamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true
  },
  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  invitedUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['member', 'admin', 'owner'],
    default: 'member'
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined', 'expired'],
    default: 'pending'
  },
  message: {
    type: String,
    trim: true,
    maxlength: 500
  },
  expiresAt: {
    type: Date,
    default: function() {
      return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 дней
    }
  },
  acceptedAt: {
    type: Date
  },
  declinedAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Индексы для оптимизации запросов
teamInvitationSchema.index({ teamId: 1, status: 1 });
teamInvitationSchema.index({ invitedUser: 1, status: 1 });
teamInvitationSchema.index({ email: 1, teamId: 1 });
teamInvitationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Виртуальные поля
teamInvitationSchema.virtual('isExpired').get(function() {
  return this.expiresAt < new Date();
});

teamInvitationSchema.virtual('canAccept').get(function() {
  return this.status === 'pending' && !this.isExpired;
});

// Методы
teamInvitationSchema.methods.accept = function() {
  this.status = 'accepted';
  this.acceptedAt = new Date();
  this.updatedAt = new Date();
  return this.save();
};

teamInvitationSchema.methods.decline = function() {
  this.status = 'declined';
  this.declinedAt = new Date();
  this.updatedAt = new Date();
  return this.save();
};

teamInvitationSchema.methods.expire = function() {
  this.status = 'expired';
  this.updatedAt = new Date();
  return this.save();
};

// Статические методы
teamInvitationSchema.statics.findPendingByUser = function(userId) {
  return this.find({
    invitedUser: userId,
    status: 'pending'
  }).populate('teamId', 'name description avatar')
    .populate('invitedBy', 'username email firstName lastName');
};

teamInvitationSchema.statics.findPendingByTeam = function(teamId) {
  return this.find({
    teamId: teamId,
    status: 'pending'
  }).populate('invitedUser', 'username email firstName lastName')
    .populate('invitedBy', 'username email firstName lastName');
};

teamInvitationSchema.statics.findByEmailAndTeam = function(email, teamId) {
  return this.findOne({
    email: email.toLowerCase(),
    teamId: teamId
  });
};

// Middleware для обновления updatedAt
teamInvitationSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Middleware для проверки срока действия
teamInvitationSchema.pre('find', function() {
  // Автоматически помечаем просроченные приглашения как expired
  this.where({
    $or: [
      { status: 'pending' },
      { status: { $exists: false } }
    ]
  });
});

// Метод для получения публичного представления
teamInvitationSchema.methods.toPublicJSON = function() {
  return {
    id: this._id,
    teamId: this.teamId,
    invitedBy: this.invitedBy,
    invitedUser: this.invitedUser,
    email: this.email,
    role: this.role,
    status: this.status,
    message: this.message,
    expiresAt: this.expiresAt,
    acceptedAt: this.acceptedAt,
    declinedAt: this.declinedAt,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
    isExpired: this.isExpired,
    canAccept: this.canAccept
  };
};

module.exports = mongoose.model('TeamInvitation', teamInvitationSchema);
