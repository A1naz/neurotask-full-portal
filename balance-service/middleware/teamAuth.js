const axios = require('axios');

// Импортируем константы из утилит
const { DATABASE_SERVICE_URL, DATABASE_SERVICE_API_KEY } = require('../utils');

// Middleware для проверки прав доступа к команде
const checkTeamPermission = (permission) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?._id;
      if (!userId) {
        return res.status(401).json({ message: 'Пользователь не авторизован' });
      }

      const teamId = req.params.teamId || req.body.teamId || req.query.teamId;
      if (!teamId) {
        return res.status(400).json({ message: 'ID команды не указан' });
      }

      // Проверяем, является ли пользователь участником команды через API
      const memberResponse = await axios.get(`${DATABASE_SERVICE_URL}/api/team-members/${teamId}/${userId}`, {
        headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
      });

      if (!memberResponse.data.success || !memberResponse.data.member.isActive) {
        return res.status(403).json({ message: 'Доступ к команде запрещен' });
      }

      const teamMember = memberResponse.data.member;

      // Проверяем права
      if (!teamMember.permissions.includes(permission)) {
        return res.status(403).json({ message: 'Недостаточно прав для выполнения операции' });
      }

      // Добавляем информацию о команде и участнике в request
      req.teamMember = teamMember;
      req.teamId = teamId;
      req.userRole = teamMember.role;

      next();
    } catch (error) {
      res.status(500).json({ message: 'Ошибка проверки прав доступа' });
    }
  };
};

// Middleware для проверки доступа к команде
const validateTeamAccess = async (req, res, next) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ message: 'Пользователь не авторизован' });
    }

    const teamId = req.params.teamId || req.body.teamId || req.query.teamId;
    if (!teamId) {
      return res.status(400).json({ message: 'ID команды не указан' });
    }

    // Проверяем существование команды через API
    const teamResponse = await axios.get(`${DATABASE_SERVICE_URL}/api/teams/${teamId}`, {
      headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
    });

    if (!teamResponse.data.success || !teamResponse.data.team.isActive) {
      return res.status(404).json({ message: 'Команда не найдена' });
    }

    const team = teamResponse.data.team;

    // Проверяем, является ли пользователь участником команды через API
    const memberResponse = await axios.get(`${DATABASE_SERVICE_URL}/api/team-members/${teamId}/${userId}`, {
      headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
    });

    if (!memberResponse.data.success || !memberResponse.data.member.isActive) {
      return res.status(403).json({ message: 'Доступ к команде запрещен' });
    }

    const teamMember = memberResponse.data.member;

    // Добавляем информацию о команде и участнике в request
    req.team = team;
    req.teamMember = teamMember;
    req.teamId = teamId;
    req.userRole = teamMember.role;

    next();
  } catch (error) {
    res.status(500).json({ message: 'Ошибка проверки доступа к команде' });
  }
};

// Middleware для проверки владения командой
const checkTeamOwnership = async (req, res, next) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ message: 'Пользователь не авторизован' });
    }

    const teamId = req.params.teamId || req.body.teamId || req.query.teamId;
    if (!teamId) {
      return res.status(400).json({ message: 'ID команды не указан' });
    }

    // Проверяем существование команды через API
    const teamResponse = await axios.get(`${DATABASE_SERVICE_URL}/api/teams/${teamId}`, {
      headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
    });

    if (!teamResponse.data.success || !teamResponse.data.team.isActive) {
      return res.status(404).json({ message: 'Команда не найдена' });
    }

    const team = teamResponse.data.team;

    // Проверяем, является ли пользователь владельцем команды
    if (team.ownerId.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Только владелец команды может выполнить это действие' });
    }

    // Добавляем информацию о команде в request
    req.team = team;
    req.teamId = teamId;
    req.userRole = 'owner';

    next();
  } catch (error) {
    res.status(500).json({ message: 'Ошибка проверки владения командой' });
  }
};

// Middleware для проверки доступа к разделу
const checkSectionAccess = (section) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?._id;
      if (!userId) {
        return res.status(401).json({ message: 'Пользователь не авторизован' });
      }

      const teamId = req.params.teamId || req.body.teamId || req.query.teamId;
      if (!teamId) {
        return res.status(400).json({ message: 'ID команды не указан' });
      }

      // Проверяем, является ли пользователь участником команды через API
      const memberResponse = await axios.get(`${DATABASE_SERVICE_URL}/api/team-members/${teamId}/${userId}`, {
        headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
      });

      if (!memberResponse.data.success || !memberResponse.data.member.isActive) {
        return res.status(403).json({ message: 'Доступ к команде запрещен' });
      }

      const teamMember = memberResponse.data.member;

      // Проверяем права доступа к разделу
      const requiredPermissions = ['read', 'write'];
      const hasAllPermissions = requiredPermissions.every(permission => 
        teamMember.permissions.includes(permission)
      );
      
      if (!hasAllPermissions) {
        return res.status(403).json({ message: `Недостаточно прав для доступа к разделу ${section}` });
      }

      // Добавляем информацию в request
      req.teamId = teamId;
      req.userRole = teamMember.role;
      req.sectionPermissions = teamMember.permissions;

      next();
    } catch (error) {
      res.status(500).json({ message: 'Ошибка проверки доступа к разделу' });
    }
  };
};

// Middleware для проверки доступа к ресурсу
const checkResourceAccess = (resourceType) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?._id;
      if (!userId) {
        return res.status(401).json({ message: 'Пользователь не авторизован' });
      }

      const teamId = req.params.teamId || req.body.teamId || req.query.teamId;
      if (!teamId) {
        return res.status(400).json({ message: 'ID команды не указан' });
      }

      // Проверяем, является ли пользователь участником команды через API
      const memberResponse = await axios.get(`${DATABASE_SERVICE_URL}/api/team-members/${teamId}/${userId}`, {
        headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
      });

      if (!memberResponse.data.success || !memberResponse.data.member.isActive) {
        return res.status(403).json({ message: 'Доступ к команде запрещен' });
      }

      const teamMember = memberResponse.data.member;

      // Проверяем права доступа к ресурсу
      const requiredPermissions = ['read', 'write'];
      const hasAllPermissions = requiredPermissions.every(permission => 
        teamMember.permissions.includes(permission)
      );
      
      if (!hasAllPermissions) {
        return res.status(403).json({ message: `Недостаточно прав для доступа к ресурсу ${resourceType}` });
      }

      // Добавляем информацию в request
      req.teamId = teamId;
      req.userRole = teamMember.role;
      req.resourceType = resourceType;

      next();
    } catch (error) {
      res.status(500).json({ message: 'Ошибка проверки доступа к ресурсу' });
    }
  };
};

module.exports = {
  checkTeamPermission,
  validateTeamAccess,
  checkTeamOwnership,
  checkSectionAccess,
  checkResourceAccess
};
