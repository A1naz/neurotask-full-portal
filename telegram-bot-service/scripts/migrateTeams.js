const mongoose = require('mongoose');
const User = require('../models/User');
const Team = require('../models/Team');
const TeamMember = require('../models/TeamMember');
require('dotenv').config();

// Подключение к базе данных
async function connectDB() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://neurotask:2SF7ZA0HU17Dq)223@87.239.104.89/neurotask';
    await mongoose.connect(mongoUri);
    } catch (error) {
    process.exit(1);
  }
}

// Создание команды по умолчанию
async function createDefaultTeam() {
  try {
    // Проверяем, существует ли уже команда по умолчанию
    const existingTeam = await Team.findOne({ name: 'Основная команда' });
    if (existingTeam) {
      return existingTeam;
    }

    // Сначала получаем первого пользователя для назначения владельцем
    const firstUser = await User.findOne({});
    if (!firstUser) {
      throw new Error('Не найдено пользователей для создания команды');
    }

    // Создаем команду по умолчанию с владельцем
    const defaultTeam = new Team({
      name: 'Основная команда',
      description: 'Основная команда для всех пользователей',
      ownerId: firstUser._id,
      settings: {
        maxMembers: 100,
        allowGuestAccess: false,
        defaultRole: 'member',
        autoApproveInvitations: true
      }
    });

    const savedTeam = await defaultTeam.save();
    return savedTeam;
  } catch (error) {
    throw error;
  }
}

// Обновление пользователей и назначение их в команду
async function updateUsersAndAssignToTeam(defaultTeam) {
  try {
    // Получаем всех пользователей
    const users = await User.find({});
    if (users.length === 0) {
      return;
    }

    // Первый пользователь уже назначен владельцем при создании команды
    const firstUser = users[0];
    // Обновляем первого пользователя
    firstUser.teamId = defaultTeam._id;
    firstUser.teamRole = 'owner';
    firstUser.isTeamOwner = true;
    await firstUser.save();

    // Создаем запись участника команды для владельца
    const ownerMember = new TeamMember({
      teamId: defaultTeam._id,
      userId: firstUser._id,
      role: 'owner',
      permissions: {
        canManageTeam: true,
        canInviteMembers: true,
        canManageMembers: true,
        canViewTasks: true,
        canCreateTasks: true,
        canEditTasks: true,
        canDeleteTasks: true,
        canViewBots: true,
        canManageBots: true,
        canViewAISettings: true,
        canManageAISettings: true
      }
    });
    await ownerMember.save();
    // Обрабатываем остальных пользователей
    for (let i = 1; i < users.length; i++) {
      const user = users[i];
      
      // Обновляем пользователя
      user.teamId = defaultTeam._id;
      user.teamRole = 'member';
      user.isTeamOwner = false;
      await user.save();

      // Создаем запись участника команды
      const member = new TeamMember({
        teamId: defaultTeam._id,
        userId: user._id,
        role: 'member',
        permissions: {
          canManageTeam: false,
          canInviteMembers: false,
          canManageMembers: false,
          canViewTasks: true,
          canCreateTasks: true,
          canEditTasks: true,
          canDeleteTasks: false,
          canViewBots: true,
          canManageBots: false,
          canViewAISettings: true,
          canManageAISettings: false
        }
      });
      await member.save();

      }

    } catch (error) {
    throw error;
  }
}

// Создание базовых прав доступа
async function createBasicPermissions() {
  try {
    // Здесь можно добавить логику создания базовых прав
    // Например, создание ролей с предустановленными permissions
    
    } catch (error) {
    throw error;
  }
}

// Основная функция миграции
async function migrateTeams() {
  try {
    await connectDB();
    
    const defaultTeam = await createDefaultTeam();
    
    await updateUsersAndAssignToTeam(defaultTeam);
    
    await createBasicPermissions();
    
    // Выводим статистику
    const teamCount = await Team.countDocuments();
    const userCount = await User.countDocuments();
    const memberCount = await TeamMember.countDocuments();
    
    } catch (error) {
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    }
}

// Запуск миграции
if (require.main === module) {
  migrateTeams();
}

module.exports = { migrateTeams };
