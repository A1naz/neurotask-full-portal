const express = require('express');
const router = express.Router();
const { requireApiKey } = require('../middleware/auth');
const Task = require('../models/Task');
const mongoose = require('mongoose');

// ===== TASK MANAGEMENT ENDPOINTS =====

// Получить задачи пользователя
router.get('/:userId', requireApiKey, async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20, status, priority, type, project } = req.query;
    
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Неверный ID пользователя'
      });
    }

    const query = { $or: [{ reporter: userId }, { assignee: userId }] };
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (type) query.type = type;
    if (project) query.project = project;

    const tasks = await Task.find(query)
      .populate('reporter', 'username email firstName lastName')
      .populate('assignee', 'username email firstName lastName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Task.countDocuments(query);

    res.json({
      success: true,
      tasks,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Ошибка получения задач пользователя'
    });
  }
});

// Создать задачу
router.post('/', requireApiKey, async (req, res) => {
  try {
    const { title, description, status, priority, type, project, assignee, dueDate, tags } = req.body;
    
    if (!title || !reporter) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Title и reporter обязательны'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(reporter)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Неверный ID репортера'
      });
    }

    if (assignee && !mongoose.Types.ObjectId.isValid(assignee)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Неверный ID исполнителя'
      });
    }

    const task = new Task({
      title,
      description,
      status: status || 'backlog',
      priority: priority || 'medium',
      type: type || 'task',
      project,
      reporter,
      assignee,
      dueDate: dueDate ? new Date(dueDate) : null,
      tags: tags || [],
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await task.save();

    res.status(201).json({
      success: true,
      message: 'Задача создана',
      task: task
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Ошибка создания задачи'
    });
  }
});

// Получить задачу по ID
router.get('/:taskId', requireApiKey, async (req, res) => {
  try {
    const { taskId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Неверный ID задачи'
      });
    }

    const task = await Task.findById(taskId)
      .populate('reporter', 'username email firstName lastName')
      .populate('assignee', 'username email firstName lastName')
      .populate('comments.authorId', 'username email firstName lastName');

    if (!task) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Задача не найдена'
      });
    }

    res.json({
      success: true,
      task: task
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Ошибка получения задачи'
    });
  }
});

// Обновить задачу
router.put('/:taskId', requireApiKey, async (req, res) => {
  try {
    const { taskId } = req.params;
    const updateData = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Неверный ID задачи'
      });
    }

    // Убираем поля, которые нельзя обновлять напрямую
    delete updateData.reporter;
    delete updateData.createdAt;

    const task = await Task.findByIdAndUpdate(
      taskId,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).populate('reporter', 'username email firstName lastName')
     .populate('assignee', 'username email firstName lastName');

    if (!task) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Задача не найдена'
      });
    }

    res.json({
      success: true,
      message: 'Задача обновлена',
      task: task
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Ошибка обновления задачи'
    });
  }
});

// Удалить задачу
router.delete('/:taskId', requireApiKey, async (req, res) => {
  try {
    const { taskId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Неверный ID задачи'
      });
    }

    const task = await Task.findByIdAndDelete(taskId);
    
    if (!task) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Задача не найдена'
      });
    }

    res.json({
      success: true,
      message: 'Задача удалена'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Ошибка удаления задачи'
    });
  }
});

// Добавить комментарий к задаче
router.post('/:taskId/comments', requireApiKey, async (req, res) => {
  try {
    const { taskId } = req.params;
    const { content, authorId } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(taskId) || !mongoose.Types.ObjectId.isValid(authorId)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Неверные ID задачи или автора'
      });
    }

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Содержание комментария обязательно'
      });
    }

    const task = await Task.findById(taskId);
    
    if (!task) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Задача не найдена'
      });
    }

    const comment = {
      content: content.trim(),
      authorId,
      createdAt: new Date()
    };

    task.comments.push(comment);
    task.updatedAt = new Date();
    await task.save();

    res.status(201).json({
      success: true,
      message: 'Комментарий добавлен',
      comment: comment
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Ошибка добавления комментария'
    });
  }
});

// Изменить статус задачи
router.patch('/:taskId/status', requireApiKey, async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status, changedBy } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(taskId) || !mongoose.Types.ObjectId.isValid(changedBy)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Неверные ID задачи или пользователя'
      });
    }

    if (!['backlog', 'todo', 'in_progress', 'review', 'done', 'cancelled'].includes(status)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Неверный статус'
      });
    }

    const task = await Task.findById(taskId);
    
    if (!task) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Задача не найдена'
      });
    }

    const oldStatus = task.status;
    task.status = status;
    task.updatedAt = new Date();

    // Добавляем запись об изменении статуса
    task.statusHistory.push({
      status: status,
      changedBy: changedBy,
      changedAt: new Date(),
      previousStatus: oldStatus
    });

    await task.save();

    res.json({
      success: true,
      message: 'Статус задачи изменен',
      task: task
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Ошибка изменения статуса задачи'
    });
  }
});

// Назначить задачу
router.patch('/:taskId/assign', requireApiKey, async (req, res) => {
  try {
    const { taskId } = req.params;
    const { assignee, assignedBy } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Неверный ID задачи'
      });
    }

    if (assignee && !mongoose.Types.ObjectId.isValid(assignee)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Неверный ID исполнителя'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(assignedBy)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Неверный ID назначающего'
      });
    }

    const task = await Task.findById(taskId);
    
    if (!task) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Задача не найдена'
      });
    }

    const oldAssignee = task.assignee;
    task.assignee = assignee || null;
    task.updatedAt = new Date();

    // Добавляем запись о назначении
    task.assignmentHistory.push({
      assignee: assignee,
      assignedBy: assignedBy,
      assignedAt: new Date(),
      previousAssignee: oldAssignee
    });

    await task.save();

    res.json({
      success: true,
      message: 'Задача назначена',
      task: task
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Ошибка назначения задачи'
    });
  }
});

// Получить статистику проекта
router.get('/project/:project/stats', requireApiKey, async (req, res) => {
  try {
    const { project } = req.params;
    
    if (!project) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Название проекта обязательно'
      });
    }

    const stats = await Task.aggregate([
      { $match: { project: project } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalTasks = await Task.countDocuments({ project });
    const completedTasks = await Task.countDocuments({ project, status: 'done' });
    const inProgressTasks = await Task.countDocuments({ 
      project, 
      status: { $in: ['todo', 'in_progress', 'review'] } 
    });

    const projectStats = {
      project,
      total: totalTasks,
      completed: completedTasks,
      inProgress: inProgressTasks,
      backlog: await Task.countDocuments({ project, status: 'backlog' }),
      cancelled: await Task.countDocuments({ project, status: 'cancelled' }),
      statusBreakdown: stats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {})
    };

    res.json({
      success: true,
      stats: projectStats
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Ошибка получения статистики проекта'
    });
  }
});

module.exports = router;
