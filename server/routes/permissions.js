const express = require('express');
const router = express.Router();
const { allMenuItems } = require('../config/menuConfig');
const { requireAuth } = require('../middleware/auth');

// Рекурсивная функция для извлечения всех ID разрешений
const getAllPermissionIds = (items) => {
  let ids = [];
  items.forEach(item => {
    ids.push({ id: item.id, label: item.label });
    if (item.children) {
      ids = ids.concat(getAllPermissionIds(item.children));
    }
  });
  return ids;
};

// @route   GET /api/permissions
// @desc    Получить все возможные разрешения для выбора
// @access  Private (только для авторизованных пользователей, в идеале - только для владельцев)
router.get('/', requireAuth, (req, res) => {
  try {
    const allPermissions = getAllPermissionIds(allMenuItems);
    
    // Удаляем "Команду", так как ее нельзя назначать
    const filteredPermissions = allPermissions.filter(p => p.id !== 'team');

    res.json({ success: true, permissions: filteredPermissions });
  } catch (error) {
    console.error("Permissions API Error:", error.message);
    res.status(500).json({ success: false, message: 'Ошибка на сервере при получении разрешений' });
  }
});

module.exports = router;
