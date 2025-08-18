const { hasPermission } = require('../config/permissions');

// Middleware для проверки прав доступа к разделам
const checkSectionAccess = (section, requiredPermission) => {
  return async (req, res, next) => {
    try {
      // Получаем роль пользователя из req.user
      const userRole = req.user?.teamRole || 'guest';
      
      // Проверяем права доступа
      if (!hasPermission(userRole, requiredPermission)) {
        return res.status(403).json({
          success: false,
          message: `Недостаточно прав для доступа к разделу "${section}"`,
          requiredPermission,
          userRole
        });
      }
      
      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Ошибка проверки прав доступа'
      });
    }
  };
};

// Middleware для проверки прав на управление командой
const checkTeamManagementAccess = checkSectionAccess('Управление командой', 'canManageTeam');

// Middleware для проверки прав на управление участниками
const checkMembersManagementAccess = checkSectionAccess('Управление участниками', 'canManageMembers');

// Middleware для проверки прав на приглашение участников
const checkInviteMembersAccess = checkSectionAccess('Приглашение участников', 'canInviteMembers');

// Middleware для проверки прав на управление задачами
const checkTasksManagementAccess = checkSectionAccess('Управление задачами', 'canManageTasks');

// Middleware для проверки прав на создание задач
const checkCreateTasksAccess = checkSectionAccess('Создание задач', 'canCreateTasks');

// Middleware для проверки прав на редактирование задач
const checkEditTasksAccess = checkSectionAccess('Редактирование задач', 'canEditTasks');

// Middleware для проверки прав на удаление задач
const checkDeleteTasksAccess = checkSectionAccess('Удаление задач', 'canDeleteTasks');

// Middleware для проверки прав на управление ботами
const checkBotsManagementAccess = checkSectionAccess('Управление ботами', 'canManageBots');

// Middleware для проверки прав на AI настройки
const checkAISettingsAccess = checkSectionAccess('AI настройки', 'canManageAISettings');

// Middleware для проверки прав на финансовую информацию
const checkFinancialAccess = checkSectionAccess('Финансовая информация', 'canViewBalance');

// Middleware для проверки прав на аналитику
const checkAnalyticsAccess = checkSectionAccess('Аналитика', 'canViewAnalytics');

// Middleware для проверки прав на экспорт данных
const checkExportAccess = checkSectionAccess('Экспорт данных', 'canExportData');

// Middleware для проверки прав на просмотр всех задач
const checkViewAllTasksAccess = checkSectionAccess('Просмотр всех задач', 'canViewAllTasks');

// Middleware для проверки прав на назначение задач
const checkAssignTasksAccess = checkSectionAccess('Назначение задач', 'canAssignTasks');

module.exports = {
  checkSectionAccess,
  checkTeamManagementAccess,
  checkMembersManagementAccess,
  checkInviteMembersAccess,
  checkTasksManagementAccess,
  checkCreateTasksAccess,
  checkEditTasksAccess,
  checkDeleteTasksAccess,
  checkBotsManagementAccess,
  checkAISettingsAccess,
  checkFinancialAccess,
  checkAnalyticsAccess,
  checkExportAccess,
  checkViewAllTasksAccess,
  checkAssignTasksAccess
};
