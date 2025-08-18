const express = require('express');
const router = express.Router();
const axios = require('axios');
const { requireAuth } = require('../middleware/auth');

// Импортируем константы из утилит
const { DATABASE_SERVICE_URL, DATABASE_SERVICE_API_KEY } = require('../utils');

// Маршруты для команд
router.post('/', requireAuth, async (req, res) => {
  try {
    const { name, description, settings } = req.body;
    const userId = req.session.userId;

    const response = await axios.post(`${DATABASE_SERVICE_URL}/api/teams`, {
      name,
      description,
      ownerId: userId,
      settings: settings || {}
    }, {
      headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
    });

    res.status(201).json(response.data);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка создания команды'
    });
  }
});

router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    
    const response = await axios.get(`${DATABASE_SERVICE_URL}/api/teams/user/${userId}`, {
      headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
    });

    res.json(response.data);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка получения команд'
    });
  }
});

router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const response = await axios.get(`${DATABASE_SERVICE_URL}/api/teams/${id}`, {
      headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
    });

    res.json(response.data);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка получения команды'
    });
  }
});

router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const response = await axios.put(`${DATABASE_SERVICE_URL}/api/teams/${id}`, updateData, {
      headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
    });

    res.json(response.data);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка обновления команды'
    });
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const response = await axios.delete(`${DATABASE_SERVICE_URL}/api/teams/${id}`, {
      headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
    });

    res.json(response.data);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка удаления команды'
    });
  }
});

// Маршруты для участников команды
router.get('/:id/members', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const response = await axios.get(`${DATABASE_SERVICE_URL}/api/teams/${id}/members`, {
      headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
    });

    res.json(response.data);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка получения участников команды'
    });
  }
});

// Обновить роль участника команды
router.put('/:id/members/:memberId/role', requireAuth, async (req, res) => {
  try {
    const { id, memberId } = req.params;
    const { role } = req.body;
    
    const response = await axios.put(`${DATABASE_SERVICE_URL}/api/teams/${id}/members/${memberId}/role`, {
      role
    }, {
      headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
    });

    res.json(response.data);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка обновления роли участника'
    });
  }
});

// Удалить участника из команды
router.delete('/:id/members/:memberId', requireAuth, async (req, res) => {
  try {
    const { id, memberId } = req.params;
    
    const response = await axios.delete(`${DATABASE_SERVICE_URL}/api/teams/${id}/members/${memberId}`, {
      headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
    });

    res.json(response.data);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка удаления участника из команды'
    });
  }
});

// Маршруты для приглашений
router.post('/:id/invitations', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { email, role } = req.body;
    
    const response = await axios.post(`${DATABASE_SERVICE_URL}/api/teams/${id}/invitations`, {
      email,
      role
    }, {
      headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
    });

    res.json(response.data);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка создания приглашения'
    });
  }
});

router.get('/:id/invitations', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const response = await axios.get(`${DATABASE_SERVICE_URL}/api/teams/${id}/invitations`, {
      headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
    });

    res.json(response.data);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка получения приглашений'
    });
  }
});

module.exports = router;
