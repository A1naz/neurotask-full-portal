const axios = require('axios');

// Database Service configuration
const DATABASE_SERVICE_URL = process.env.DATABASE_SERVICE_URL || 'http://localhost:3012';
const DATABASE_SERVICE_API_KEY = process.env.DATABASE_SERVICE_API_KEY || 'database-service-secure-api-key-2024';

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

      // Проверяем, является ли пользователь участником команды
      const teamMemberResponse = await axios.get(`${DATABASE_SERVICE_URL}/api/team-members/${teamId}/${userId}`, {
        headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
      });

      const teamMember = teamMemberResponse.data;
      if (!teamMember) {
        return res.status(403).json({ message: 'Доступ к команде запрещен' });
      }

      // Проверяем права
      if (!teamMember.hasPermission(permission)) {
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

    // Проверяем существование команды
    const teamResponse = await axios.get(`${DATABASE_SERVICE_URL}/api/teams/${teamId}`, {
      headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
    });

    const team = teamResponse.data;
    if (!team || !team.isActive) {
      return res.status(404).json({ message: 'Команда не найдена' });
    }

    // Проверяем, является ли пользователь участником команды
    const teamMemberResponse = await axios.get(`${DATABASE_SERVICE_URL}/api/team-members/${teamId}/${userId}`, {
      headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
    });

    const teamMember = teamMemberResponse.data;
    if (!teamMember) {
      return res.status(403).json({ message: 'Доступ к команде запрещен' });
    }

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

    // Проверяем, является ли пользователь владельцем команды
    const teamResponse = await axios.get(`${DATABASE_SERVICE_URL}/api/teams/${teamId}`, {
      headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
    });

    const team = teamResponse.data;
    if (!team) {
      return res.status(404).json({ message: 'Команда не найдена' });
    }

    if (team.ownerId.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Только владелец команды может выполнить эту операцию' });
    }

    // Добавляем информацию о команде в request
    req.team = team;
    req.teamId = teamId;

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

      // Проверяем, является ли пользователь участником команды
      const teamMemberResponse = await axios.get(`${DATABASE_SERVICE_URL}/api/team-members/${teamId}/${userId}`, {
        headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
      });

      const teamMember = teamMemberResponse.data;
      if (!teamMember) {
        return res.status(403).json({ message: 'Доступ к команде запрещен' });
      }

      // Проверяем права на раздел
      if (!teamMember.hasPermission(`canView${section}`)) {
        return res.status(403).json({ message: `Недостаточно прав для доступа к разделу ${section}` });
      }

      // Добавляем информацию в request
      req.teamMember = teamMember;
      req.teamId = teamId;
      req.userRole = teamMember.role;

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

      const resourceId = req.params[`${resourceType}Id`] || req.body[`${resourceType}Id`];
      if (!resourceId) {
        return res.status(400).json({ message: `ID ${resourceType} не указан` });
      }

      // Проверяем, является ли пользователь участником команды
      const teamMemberResponse = await axios.get(`${DATABASE_SERVICE_URL}/api/team-members/${teamId}/${userId}`, {
        headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
      });

      const teamMember = teamMemberResponse.data;
      if (!teamMember) {
        return res.status(403).json({ message: 'Доступ к команде запрещен' });
      }

      // Проверяем права на ресурс
      if (!teamMember.hasPermission(`canView${resourceType.charAt(0).toUpperCase() + resourceType.slice(1)}s`)) {
        return res.status(403).json({ message: `Недостаточно прав для доступа к ${resourceType}` });
      }

      // Добавляем информацию в request
      req.teamMember = teamMember;
      req.teamId = teamId;
      req.userRole = teamMember.role;
      req[`${resourceType}Id`] = resourceId;

      next();
    } catch (error) {
      res.status(500).json({ message: 'Ошибка проверки доступа к ресурсу' });
    }
  };
};

// Middleware для проверки активного участника команды
const checkActiveTeamMember = async (req, res, next) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ message: 'Пользователь не авторизован' });
    }

    // Проверяем, является ли пользователь активным участником команды
    const teamMemberResponse = await axios.get(`${DATABASE_SERVICE_URL}/api/team-members/user/${userId}/active`, {
      headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
    });

    const teamMember = teamMemberResponse.data;
    if (!teamMember) {
      return res.status(403).json({ message: 'Пользователь не является активным участником команды' });
    }

    // Добавляем информацию в request
    req.teamMember = teamMember;
    req.teamId = teamMember.teamId;
    req.userRole = teamMember.role;

    next();
  } catch (error) {
    res.status(500).json({ message: 'Ошибка проверки активного участника команды' });
  }
};

module.exports = {
  checkTeamPermission,
  validateTeamAccess,
  checkTeamOwnership,
  checkSectionAccess,
  checkResourceAccess,
  checkActiveTeamMember
};
