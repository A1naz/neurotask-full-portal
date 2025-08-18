// Конфигурация прав доступа для ролей команд
const ROLE_PERMISSIONS = {
  owner: {
    name: 'Владелец',
    description: 'Полный доступ ко всем функциям команды',
    permissions: {
      // Управление командой
      canManageTeam: true,
      canInviteMembers: true,
      canManageMembers: true,
      canDeleteTeam: true,
      canTransferOwnership: true,
      
      // Управление задачами
      canViewTasks: true,
      canCreateTasks: true,
      canEditTasks: true,
      canDeleteTasks: true,
      canAssignTasks: true,
      canViewAllTasks: true,
      
      // Управление ботами
      canViewBots: true,
      canManageBots: true,
      canCreateBots: true,
      canDeleteBots: true,
      
      // AI настройки
      canViewAISettings: true,
      canManageAISettings: true,
      canConfigureAI: true,
      
      // Финансы и баланс
      canViewBalance: true,
      canManageBilling: true,
      canViewInvoices: true,
      
      // Аналитика и отчеты
      canViewAnalytics: true,
      canExportData: true,
      canViewReports: true
    }
  },
  
  admin: {
    name: 'Администратор',
    description: 'Расширенные права управления командой',
    permissions: {
      // Управление командой
      canManageTeam: true,
      canInviteMembers: true,
      canManageMembers: true,
      canDeleteTeam: false,
      canTransferOwnership: false,
      
      // Управление задачами
      canViewTasks: true,
      canCreateTasks: true,
      canEditTasks: true,
      canDeleteTasks: true,
      canAssignTasks: true,
      canViewAllTasks: true,
      
      // Управление ботами
      canViewBots: true,
      canManageBots: true,
      canCreateBots: true,
      canDeleteBots: false,
      
      // AI настройки
      canViewAISettings: true,
      canManageAISettings: true,
      canConfigureAI: true,
      
      // Финансы и баланс
      canViewBalance: true,
      canManageBilling: false,
      canViewInvoices: true,
      
      // Аналитика и отчеты
      canViewAnalytics: true,
      canExportData: true,
      canViewReports: true
    }
  },
  
  manager: {
    name: 'Менеджер',
    description: 'Права на управление задачами и участниками',
    permissions: {
      // Управление командой
      canManageTeam: false,
      canInviteMembers: true,
      canManageMembers: false,
      canDeleteTeam: false,
      canTransferOwnership: false,
      
      // Управление задачами
      canViewTasks: true,
      canCreateTasks: true,
      canEditTasks: true,
      canDeleteTasks: false,
      canAssignTasks: true,
      canViewAllTasks: true,
      
      // Управление ботами
      canViewBots: true,
      canManageBots: false,
      canCreateBots: false,
      canDeleteBots: false,
      
      // AI настройки
      canViewAISettings: true,
      canManageAISettings: false,
      canConfigureAI: false,
      
      // Финансы и баланс
      canViewBalance: true,
      canManageBilling: false,
      canViewInvoices: false,
      
      // Аналитика и отчеты
      canViewAnalytics: true,
      canExportData: false,
      canViewReports: true
    }
  },
  
  member: {
    name: 'Участник',
    description: 'Базовые права для работы с задачами',
    permissions: {
      // Управление командой
      canManageTeam: false,
      canInviteMembers: false,
      canManageMembers: false,
      canDeleteTeam: false,
      canTransferOwnership: false,
      
      // Управление задачами
      canViewTasks: true,
      canCreateTasks: true,
      canEditTasks: true,
      canDeleteTasks: false,
      canAssignTasks: false,
      canViewAllTasks: false,
      
      // Управление ботами
      canViewBots: true,
      canManageBots: false,
      canCreateBots: false,
      canDeleteBots: false,
      
      // AI настройки
      canViewAISettings: true,
      canManageAISettings: false,
      canConfigureAI: false,
      
      // Финансы и баланс
      canViewBalance: false,
      canManageBilling: false,
      canViewInvoices: false,
      
      // Аналитика и отчеты
      canViewAnalytics: false,
      canExportData: false,
      canViewReports: false
    }
  },
  
  guest: {
    name: 'Гость',
    description: 'Ограниченный доступ только для просмотра',
    permissions: {
      // Управление командой
      canManageTeam: false,
      canInviteMembers: false,
      canManageMembers: false,
      canDeleteTeam: false,
      canTransferOwnership: false,
      
      // Управление задачами
      canViewTasks: true,
      canCreateTasks: false,
      canEditTasks: false,
      canDeleteTasks: false,
      canAssignTasks: false,
      canViewAllTasks: false,
      
      // Управление ботами
      canViewBots: false,
      canManageBots: false,
      canCreateBots: false,
      canDeleteBots: false,
      
      // AI настройки
      canViewAISettings: false,
      canManageAISettings: false,
      canConfigureAI: false,
      
      // Финансы и баланс
      canViewBalance: false,
      canManageBilling: false,
      canViewInvoices: false,
      
      // Аналитика и отчеты
      canViewAnalytics: false,
      canExportData: false,
      canViewReports: false
    }
  }
};

// Функция для получения прав по роли
function getPermissionsByRole(role) {
  return ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.member;
}

// Функция для проверки конкретного права
function hasPermission(role, permission) {
  const rolePermissions = getPermissionsByRole(role);
  return rolePermissions.permissions[permission] || false;
}

// Функция для получения всех ролей
function getAllRoles() {
  return Object.keys(ROLE_PERMISSIONS);
}

// Функция для получения описания роли
function getRoleDescription(role) {
  const roleConfig = ROLE_PERMISSIONS[role];
  return roleConfig ? roleConfig.description : 'Роль не найдена';
}

module.exports = {
  ROLE_PERMISSIONS,
  getPermissionsByRole,
  hasPermission,
  getAllRoles,
  getRoleDescription
};
