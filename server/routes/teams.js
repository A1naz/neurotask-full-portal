const express = require('express');
const router = express.Router();
const axios = require('axios');
const { requireAuth } = require('../middleware/auth');
const utils = require('../utils');
const { DATABASE_SERVICE_URL, DATABASE_SERVICE_API_KEY } = utils;

// Получить список сотрудников
router.get('/', requireAuth, async (req, res) => {
  try {
    const ownerId = req.session.userId; // Владелец - это текущий залогиненный пользователь
    const response = await axios.get(`${DATABASE_SERVICE_URL}/api/teams/${ownerId}`, {
      headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Ошибка на сервере при получении списка сотрудников.' });
  }
});

// Создать нового сотрудника
router.post('/', requireAuth, async (req, res) => {
  try {
    const ownerId = req.session.userId;
    const response = await axios.post(`${DATABASE_SERVICE_URL}/api/teams/${ownerId}`, req.body, {
      headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    const status = error.response ? error.response.status : 500;
    const data = error.response ? error.response.data : { success: false, message: 'Ошибка на сервере при создании сотрудника.' };
    res.status(status).json(data);
  }
});

// Обновить данные сотрудника
router.put('/:employeeId', requireAuth, async (req, res) => {
  try {
    const { employeeId } = req.params;
    const response = await axios.put(`${DATABASE_SERVICE_URL}/api/teams/${employeeId}`, req.body, {
      headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Ошибка на сервере при обновлении данных сотрудника.' });
  }
});

// Удалить сотрудника
router.delete('/:employeeId', requireAuth, async (req, res) => {
  try {
    const { employeeId } = req.params;
    const response = await axios.delete(`${DATABASE_SERVICE_URL}/api/teams/${employeeId}`, {
      headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Ошибка на сервере при удалении сотрудника.' });
  }
});

module.exports = router;
