const express = require('express');
const router = express.Router();
const axios = require('axios');
const allMenuItems = require('../config/menuConfig');
const { requireAuth } = require('../middleware/auth');
const utils = require('../utils');
const { DATABASE_SERVICE_URL, DATABASE_SERVICE_API_KEY } = utils;

// @route   GET /api/menu
// @desc    Get menu items based on user permissions
// @access  Private
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Пользователь не авторизован.' });
    }

    // Запрос к database-service для получения данных о пользователе
    const userResponse = await axios.get(`${DATABASE_SERVICE_URL}/api/users/${userId}`, {
      headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
    });
    
    if (!userResponse.data.success) {
      // Если пользователя не нашли, отдаем пустое меню
      return res.json({ success: true, menuItems: [] });
    }
    
    const user = userResponse.data.user;
    let finalMenuItems = [];

    console.log(user, "user");

    // Владелец видит всё и вкладку "Команда"
    if (user.isTeamOwner) {
      finalMenuItems = [...allMenuItems];
      // Добавляем пункт "Команда", если его еще нет
      if (!finalMenuItems.some(item => item.id === 'team')) {
        finalMenuItems.push({
          id: 'team',
          label: 'Команда',
          iconName: 'Users',
          path: '/team',
          description: 'Управление сотрудниками'
        });
      }
    } else {
      // Сотрудники видят только разрешенные разделы
      const filterRecursive = (items) => {
        return items.reduce((acc, item) => {
          if (user.permissions.includes(item.id)) {
            const newItem = { ...item };
            if (item.children) {
              newItem.children = filterRecursive(item.children);
            }
            acc.push(newItem);
          }
          return acc;
        }, []);
      };
      finalMenuItems = filterRecursive(allMenuItems);
    }
    
    res.json({ success: true, menuItems: finalMenuItems });

  } catch (error) {
    // В случае ошибки отдаем пустое меню, чтобы не ломать интерфейс
    res.json({ success: true, menuItems: [] });
  }
});

module.exports = router;
