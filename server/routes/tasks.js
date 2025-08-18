const express = require('express');
const router = express.Router();
const axios = require('axios');
const { requireAuth } = require('../middleware/auth');

// Импортируем константы из утилит
const utils = require('../utils');
const { DATABASE_SERVICE_URL, DATABASE_SERVICE_API_KEY } = utils;

// Получить задачи пользователя
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const { status, priority, assignee, project, limit = 50, offset = 0 } = req.query;
    
    const tasksResponse = await axios.get(`${DATABASE_SERVICE_URL}/api/users/${userId}/tasks`, {
      params: { status, priority, assignee, project, limit, offset },
      headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
    });

    res.json(tasksResponse.data);

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка получения задач'
    });
  }
});

// Создать задачу
router.post('/', requireAuth, async (req, res) => {
  try {
    const taskData = req.body;
    const createResponse = await axios.post(`${DATABASE_SERVICE_URL}/api/tasks`, {
      ...taskData,
      reporter: req.session.userId
    }, {
      headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
    });

    res.json(createResponse.data);

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка создания задачи'
    });
  }
});

// Получить задачу по ID
router.get('/:taskId', requireAuth, async (req, res) => {
  try {
    const { taskId } = req.params;
    
    const taskResponse = await axios.get(`${DATABASE_SERVICE_URL}/api/tasks/${taskId}`, {
      headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
    });

    res.json(taskResponse.data);

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка получения задачи'
    });
  }
});

// Обновить задачу
router.put('/:taskId', requireAuth, async (req, res) => {
  try {
    const { taskId } = req.params;
    const updateData = req.body;
    
    const updateResponse = await axios.put(`${DATABASE_SERVICE_URL}/api/tasks/${taskId}`, updateData, {
      headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
    });

    res.json(updateResponse.data);

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка обновления задачи'
    });
  }
});

// Удалить задачу
router.delete('/:taskId', requireAuth, async (req, res) => {
  try {
    const { taskId } = req.params;
    
    const deleteResponse = await axios.delete(`${DATABASE_SERVICE_URL}/api/tasks/${taskId}`, {
      headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
    });

    res.json(deleteResponse.data);

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка удаления задачи'
    });
  }
});

// Добавить комментарий к задаче
router.post('/:taskId/comments', requireAuth, async (req, res) => {
  try {
    const { taskId } = req.params;
    const { content, attachments = [] } = req.body;
    
    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Содержание комментария обязательно'
      });
    }

    const commentResponse = await axios.post(`${DATABASE_SERVICE_URL}/api/tasks/${taskId}/comments`, {
      content,
      authorId: req.session.userId,
      attachments
    }, {
      headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
    });

    res.json(commentResponse.data);

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка добавления комментария'
    });
  }
});

// Изменить статус задачи
router.patch('/:taskId/status', requireAuth, async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Статус обязателен'
      });
    }

    const updateResponse = await axios.patch(`${DATABASE_SERVICE_URL}/api/tasks/${taskId}/status`, {
      status,
      changedBy: req.session.userId
    }, {
      headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
    });

    res.json(updateResponse.data);

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка изменения статуса'
    });
  }
});

// Назначить исполнителя задачи
router.patch('/:taskId/assign', requireAuth, async (req, res) => {
  try {
    const { taskId } = req.params;
    const { assigneeId } = req.body;
    
    if (!assigneeId) {
      return res.status(400).json({
        success: false,
        message: 'ID исполнителя обязателен'
      });
    }

    const updateResponse = await axios.patch(`${DATABASE_SERVICE_URL}/api/tasks/${taskId}/assign`, {
      assigneeId,
      assignedBy: req.session.userId
    }, {
      headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
    });

    res.json(updateResponse.data);

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка назначения исполнителя'
    });
  }
});

// Получить статистику задач по проекту
router.get('/project/:project/stats', requireAuth, async (req, res) => {
  try {
    const { project } = req.params;
    
    const statsResponse = await axios.get(`${DATABASE_SERVICE_URL}/api/tasks/${project}/stats`, {
      headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
    });

    res.json(statsResponse.data);

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка получения статистики задач'
    });
  }
});

module.exports = router;
