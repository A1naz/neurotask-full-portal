const axios = require('axios');

// Импортируем константы из утилит
const { DATABASE_SERVICE_URL, DATABASE_SERVICE_API_KEY } = require('../utils');

/**
 * Проверяет, имеет ли пользователь доступ к команде
 */
const validateTeamAccess = async (req, res, next) => {
  try {
    const { id: teamId } = req.params;
    const userId = req.session.userId;

    // Проверяем существование команды
    const teamResponse = await axios.get(`${DATABASE_SERVICE_URL}/api/teams/${teamId}`, {
      headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
    });

    if (!teamResponse.data.success) {
      return res.status(404).json({
        success: false,
        message: 'Команда не найдена'
      });
    }

    const team = teamResponse.data.team;

    // Проверяем, является ли пользователь участником команды
    const memberResponse = await axios.get(`${DATABASE_SERVICE_URL}/api/team-members/${teamId}/${userId}`, {
      headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
    });

    if (!memberResponse.data.success || !memberResponse.data.member.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Доступ к команде запрещен'
      });
    }

    // Добавляем информацию о команде и участнике в req
    req.team = team;
    req.teamMember = memberResponse.data.member;
    req.teamId = teamId;

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка проверки доступа',
      error: error.message
    });
  }
};

/**
 * Проверяет, является ли пользователь владельцем команды
 */
const checkTeamOwnership = async (req, res, next) => {
  try {
    const { id: teamId } = req.params;
    const userId = req.session.userId;

    // Проверяем существование команды
    const teamResponse = await axios.get(`${DATABASE_SERVICE_URL}/api/teams/${teamId}`, {
      headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
    });

    if (!teamResponse.data.success) {
      return res.status(404).json({
        success: false,
        message: 'Команда не найдена'
      });
    }

    const team = teamResponse.data.team;

    // Проверяем, является ли пользователь владельцем
    if (team.ownerId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Только владелец команды может выполнить это действие'
      });
    }

    // Добавляем информацию о команде в req
    req.team = team;
    req.teamId = teamId;

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка проверки владения',
      error: error.message
    });
  }
};

/**
 * Проверяет, имеет ли пользователь определенные права в команде
 * @param {string|Array} requiredPermissions - требуемые права или роль
 */
const checkTeamPermission = (requiredPermissions) => {
  return async (req, res, next) => {
    try {
      const { id: teamId } = req.params;
      const userId = req.session.userId;

      // Проверяем существование команды
      const teamResponse = await axios.get(`${DATABASE_SERVICE_URL}/api/teams/${teamId}`, {
        headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
      });

      if (!teamResponse.data.success) {
        return res.status(404).json({
          success: false,
          message: 'Команда не найдена'
        });
      }

      const team = teamResponse.data.team;

      // Проверяем, является ли пользователь владельцем (имеет все права)
      if (team.ownerId.toString() === userId) {
        req.team = team;
        req.teamId = teamId;
        return next();
      }

      // Проверяем права участника
      const memberResponse = await axios.get(`${DATABASE_SERVICE_URL}/api/team-members/${teamId}/${userId}`, {
        headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
      });

      if (!memberResponse.data.success || !memberResponse.data.member.isActive) {
        return res.status(403).json({
          success: false,
          message: 'Доступ к команде запрещен'
        });
      }

      const member = memberResponse.data.member;

      // Проверяем права доступа
      if (Array.isArray(requiredPermissions)) {
        const hasAllPermissions = requiredPermissions.every(permission => 
          member.permissions.includes(permission)
        );
        
        if (!hasAllPermissions) {
          return res.status(403).json({
            success: false,
            message: 'Недостаточно прав для выполнения действия'
          });
        }
      } else if (typeof requiredPermissions === 'string') {
        // Проверяем роль
        const allowedRoles = ['owner', 'admin'];
        if (!allowedRoles.includes(member.role)) {
          return res.status(403).json({
            success: false,
            message: 'Недостаточно прав для выполнения действия'
          });
        }
      }

      // Добавляем информацию в req
      req.team = team;
      req.teamMember = member;
      req.teamId = teamId;

      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Ошибка проверки прав',
        error: error.message
      });
    }
  };
};

/**
 * Проверяет доступ к определенному разделу команды
 * @param {string} section - раздел (dashboard, tasks, bots, ai-settings, etc.)
 * @param {string|Array} requiredPermissions - требуемые права
 */
const checkSectionAccess = (section, requiredPermissions) => {
  return async (req, res, next) => {
    try {
      const { id: teamId } = req.params;
      const userId = req.session.userId;

      // Проверяем существование команды
      const teamResponse = await axios.get(`${DATABASE_SERVICE_URL}/api/teams/${teamId}`, {
        headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
      });

      if (!teamResponse.data.success) {
        return res.status(404).json({
          success: false,
          message: 'Команда не найдена'
        });
      }

      const team = teamResponse.data.team;

      // Проверяем, является ли пользователь владельцем
      if (team.ownerId.toString() === userId) {
        req.team = team;
        req.teamId = teamId;
        return next();
      }

      // Проверяем права участника для конкретного раздела
      const memberResponse = await axios.get(`${DATABASE_SERVICE_URL}/api/team-members/${teamId}/${userId}`, {
        headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
      });

      if (!memberResponse.data.success || !memberResponse.data.member.isActive) {
        return res.status(403).json({
          success: false,
          message: 'Доступ к команде запрещен'
        });
      }

      const member = memberResponse.data.member;

      // Проверяем права доступа к разделу
      if (Array.isArray(requiredPermissions)) {
        const hasAllPermissions = requiredPermissions.every(permission => 
          member.permissions.includes(permission)
        );
        
        if (!hasAllPermissions) {
          return res.status(403).json({
            success: false,
            message: `Недостаточно прав для доступа к разделу ${section}`
          });
        }
      } else if (typeof requiredPermissions === 'string') {
        // Проверяем роль
        const allowedRoles = ['owner', 'admin', 'manager'];
        if (!allowedRoles.includes(member.role)) {
          return res.status(403).json({
            success: false,
            message: `Недостаточно прав для доступа к разделу ${section}`
          });
        }
      }

      // Добавляем информацию в req
      req.team = team;
      req.teamMember = member;
      req.teamId = teamId;

      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Ошибка проверки доступа к разделу',
        error: error.message
      });
    }
  };
};

/**
 * Проверяет доступ к ресурсу команды
 * @param {string} resourceType - тип ресурса (task, bot, ai-setting, etc.)
 */
const checkResourceAccess = (resourceType) => {
  return async (req, res, next) => {
    try {
      const { id: teamId } = req.params;
      const userId = req.session.userId;

      // Проверяем существование команды
      const teamResponse = await axios.get(`${DATABASE_SERVICE_URL}/api/teams/${teamId}`, {
        headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
      });

      if (!teamResponse.data.success) {
        return res.status(404).json({
          success: false,
          message: 'Команда не найдена'
        });
      }

      const team = teamResponse.data.team;

      // Проверяем, является ли пользователь владельцем
      if (team.ownerId.toString() === userId) {
        req.team = team;
        req.teamId = teamId;
        return next();
      }

      // Проверяем права участника
      const memberResponse = await axios.get(`${DATABASE_SERVICE_URL}/api/team-members/${teamId}/${userId}`, {
        headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
      });

      if (!memberResponse.data.success || !memberResponse.data.member.isActive) {
        return res.status(403).json({
          success: false,
          message: 'Доступ к команде запрещен'
        });
      }

      const member = memberResponse.data.member;

      // Проверяем права доступа к ресурсу
      const requiredPermissions = ['read', 'write'];
      const hasAllPermissions = requiredPermissions.every(permission => 
        member.permissions.includes(permission)
      );
      
      if (!hasAllPermissions) {
        return res.status(403).json({
          success: false,
          message: `Недостаточно прав для доступа к ресурсу ${resourceType}`
        });
      }

      // Добавляем информацию в req
      req.team = team;
      req.teamMember = member;
      req.teamId = teamId;

      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Ошибка проверки доступа к ресурсу',
        error: error.message
      });
    }
  };
};

/**
 * Логирует действия в команде
 * @param {string} action - действие для логирования
 */
const logTeamAction = (action) => {
  return async (req, res, next) => {
    try {
      // Здесь можно добавить логирование действий в команде
      console.log(`🔍 Team action logged: ${action} at ${new Date().toISOString()}`);
      
      next();
    } catch (error) {
      next(); // Продолжаем выполнение даже при ошибке логирования
    }
  };
};

module.exports = {
  validateTeamAccess,
  checkTeamOwnership,
  checkTeamPermission,
  checkSectionAccess,
  checkResourceAccess,
  logTeamAction
};
