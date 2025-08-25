const express = require('express');
const router = express.Router();
const axios = require('axios');
const { allMenuItems } = require('../config/menuConfig'); // Используем allMenuItems
const { requireAuth } = require('../middleware/auth');
const { DATABASE_SERVICE_URL, DATABASE_SERVICE_API_KEY } = require('../utils');

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
      // Возвращаем пустые меню, если пользователь не найден
      return res.json({ success: true, sidebarMenuItems: [], profileMenuItems: [] });
    }
    
    const user = userResponse.data.user;
    let finalSidebarMenu = [];
    let finalProfileMenu = [];

    // Рекурсивная функция для фильтрации меню
    const filterRecursive = (items, userPermissions) => {
      return items.reduce((acc, item) => {
        if (userPermissions.includes(item.id)) {
          const newItem = { ...item };
          if (item.children) {
            newItem.children = filterRecursive(item.children, userPermissions);
          }
          acc.push(newItem);
        }
        return acc;
      }, []);
    };
    
    if (user && user.isTeamOwner) {
      // Владелец видит все
      finalSidebarMenu = allMenuItems.filter(item => item.locations.includes('sidebar'));
      finalProfileMenu = allMenuItems.filter(item => item.locations.includes('profile'));

      // Добавляем "Управление командой" в меню профиля для владельца
      finalProfileMenu.push({
        id: 'team',
        label: 'Управление командой',
        iconName: 'Users',
        path: '/team',
        description: 'Участники и настройки'
      });
      
    } else if (user) {
      // Обычный пользователь видит только то, что ему разрешено
      const userPermissions = user.permissions || [];
      const accessibleItems = filterRecursive(allMenuItems, userPermissions);
      
      finalSidebarMenu = accessibleItems.filter(item => item.locations.includes('sidebar'));
      finalProfileMenu = accessibleItems.filter(item => item.locations.includes('profile'));
    }

    res.json({ success: true, sidebarMenuItems: finalSidebarMenu, profileMenuItems: finalProfileMenu });

  } catch (error) {
    console.error("Menu API Error:", error.message);
    // В случае ошибки отдаем пустые меню, чтобы фронтенд не падал
    res.json({ success: true, sidebarMenuItems: [], profileMenuItems: [] });
  }
});

module.exports = router;
