const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  // Основная информация
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  
  // Статус и приоритет
  status: {
    type: String,
    enum: ['backlog', 'todo', 'in-progress', 'review', 'done'],
    default: 'backlog'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  
  // Тип задачи
  type: {
    type: String,
    enum: ['task', 'bug', 'feature', 'story', 'epic'],
    default: 'task'
  },
  
  // Назначение и создание
  assignee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Временные метки
  dueDate: {
    type: Date
  },
  estimatedHours: {
    type: Number,
    min: 0
  },
  actualHours: {
    type: Number,
    min: 0,
    default: 0
  },
  
  // Теги и категории
  labels: [{
    type: String,
    trim: true
  }],
  project: {
    type: String,
    trim: true,
    default: 'General'
  },
  
  // Связанные задачи
  parentTask: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  },
  subtasks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  }],
  
  // Комментарии
  comments: [{
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    attachments: [{
      filename: String,
      url: String,
      size: Number
    }]
  }],
  
  // История изменений
  history: [{
    field: String,
    oldValue: mongoose.Schema.Types.Mixed,
    newValue: mongoose.Schema.Types.Mixed,
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Дополнительные поля
  attachments: [{
    filename: String,
    url: String,
    size: Number,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Sprint и планирование
  sprint: {
    type: String,
    trim: true
  },
  storyPoints: {
    type: Number,
    min: 0
  },
  
  // Метаданные
  isArchived: {
    type: Boolean,
    default: false
  },
  tags: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
});

// Индексы для быстрого поиска
taskSchema.index({ status: 1, priority: 1 });
taskSchema.index({ assignee: 1, status: 1 });
taskSchema.index({ project: 1, status: 1 });
taskSchema.index({ dueDate: 1 });
taskSchema.index({ labels: 1 });
taskSchema.index({ sprint: 1 });

// Виртуальное поле для вычисления прогресса
taskSchema.virtual('progress').get(function() {
  if (this.status === 'done') return 100;
  if (this.status === 'review') return 80;
  if (this.status === 'in-progress') return 50;
  if (this.status === 'todo') return 25;
  return 0;
});

// Виртуальное поле для вычисления просроченности
taskSchema.virtual('isOverdue').get(function() {
  if (!this.dueDate) return false;
  return new Date() > this.dueDate && this.status !== 'done';
});

// Метод для добавления комментария
taskSchema.methods.addComment = function(authorId, content, attachments = []) {
  this.comments.push({
    author: authorId,
    content,
    attachments,
    timestamp: new Date()
  });
  return this.save();
};

// Метод для изменения статуса с записью в историю
taskSchema.methods.changeStatus = function(newStatus, changedBy) {
  const oldStatus = this.status;
  this.status = newStatus;
  
  this.history.push({
    field: 'status',
    oldValue: oldStatus,
    newValue: newStatus,
    changedBy,
    timestamp: new Date()
  });
  
  return this.save();
};

// Метод для назначения исполнителя с записью в историю
taskSchema.methods.assignTo = function(assigneeId, assignedBy) {
  const oldAssignee = this.assignee;
  this.assignee = assigneeId;
  
  this.history.push({
    field: 'assignee',
    oldValue: oldAssignee,
    newValue: assigneeId,
    changedBy: assignedBy,
    timestamp: new Date()
  });
  
  return this.save();
};

// Статический метод для поиска задач по фильтрам
taskSchema.statics.findByFilters = function(filters = {}) {
  const query = {};
  
  if (filters.status) query.status = filters.status;
  if (filters.priority) query.priority = filters.priority;
  if (filters.type) query.type = filters.type;
  if (filters.assignee) query.assignee = filters.assignee;
  if (filters.reporter) query.reporter = filters.reporter;
  if (filters.project) query.project = filters.project;
  if (filters.sprint) query.sprint = filters.sprint;
  if (filters.labels && filters.labels.length > 0) {
    query.labels = { $in: filters.labels };
  }
  if (filters.isOverdue) {
    query.dueDate = { $lt: new Date() };
    query.status = { $ne: 'done' };
  }
  
  return this.find(query).populate('assignee', 'username email').populate('reporter', 'username email');
};

// Статический метод для получения статистики по проекту
taskSchema.statics.getProjectStats = function(project) {
  return this.aggregate([
    { $match: { project, isArchived: false } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalStoryPoints: { $sum: { $ifNull: ['$storyPoints', 0] } },
        totalEstimatedHours: { $sum: { $ifNull: ['$estimatedHours', 0] } },
        totalActualHours: { $sum: { $ifNull: ['$actualHours', 0] } }
      }
    }
  ]);
};

// Статический метод для получения задач пользователя
taskSchema.statics.getUserTasks = function(userId, includeArchived = false) {
  const query = {
    $or: [
      { assignee: userId },
      { reporter: userId }
    ]
  };
  
  if (!includeArchived) {
    query.isArchived = false;
  }
  
  return this.find(query)
    .populate('assignee', 'username email')
    .populate('reporter', 'username email')
    .sort({ updatedAt: -1 });
};

// Middleware для автоматического обновления lastActivity
taskSchema.pre('save', function(next) {
  if (this.isModified()) {
    this.history.push({
      field: 'general',
      oldValue: null,
      newValue: 'Task updated',
      changedBy: this.reporter,
      timestamp: new Date()
    });
  }
  next();
});

module.exports = mongoose.model('Task', taskSchema);
