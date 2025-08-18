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
    process.exit(1);
  }
}

// Проверка команд
async function checkTeams() {
  try {
    const teams = await Team.find({});
    if (teams.length === 0) {
      return;
    }
    
    for (const team of teams) {
      }
    
  } catch (error) {
    }
}

// Проверка пользователей
async function checkUsers() {
  try {
    const users = await User.find({});
    if (users.length === 0) {
      return;
    }
    
    // Статистика по ролям
    const roleStats = {};
    const teamStats = {};
    
    for (const user of users) {
      // Подсчет ролей
      const role = user.teamRole || 'не назначена';
      roleStats[role] = (roleStats[role] || 0) + 1;
      
      // Подсчет по командам
      if (user.teamId) {
        const teamId = user.teamId.toString();
        teamStats[teamId] = (teamStats[teamId] || 0) + 1;
      }
    }
    
    for (const [role, count] of Object.entries(roleStats)) {
      }
    
    for (const [teamId, count] of Object.entries(teamStats)) {
      }
    
    // Пользователи без команды
    const usersWithoutTeam = users.filter(user => !user.teamId);
    if (usersWithoutTeam.length > 0) {
      for (const user of usersWithoutTeam.slice(0, 5)) { // Показываем первые 5
        `);
      }
      if (usersWithoutTeam.length > 5) {
        }
    }
    
  } catch (error) {
    }
}

// Проверка участников команд
async function checkTeamMembers() {
  try {
    const members = await TeamMember.find({});
    if (members.length === 0) {
      return;
    }
    
    // Статистика по ролям
    const roleStats = {};
    const teamStats = {};
    
    for (const member of members) {
      // Подсчет ролей
      const role = member.role || 'не назначена';
      roleStats[role] = (roleStats[role] || 0) + 1;
      
      // Подсчет по командам
      const teamId = member.teamId.toString();
      teamStats[teamId] = (teamStats[teamId] || 0) + 1;
    }
    
    for (const [role, count] of Object.entries(roleStats)) {
      }
    
    for (const [teamId, count] of Object.entries(teamStats)) {
      }
    
    // Проверка активных участников
    const activeMembers = members.filter(member => member.isActive !== false);
    // Проверка участников с расширенными правами
    const membersWithExtendedPermissions = members.filter(member => 
      member.permissions.canManageTeam || 
      member.permissions.canInviteMembers || 
      member.permissions.canManageMembers
    );
    } catch (error) {
    }
}

// Проверка целостности данных
async function checkDataIntegrity() {
  try {
    const users = await User.find({});
    const teams = await Team.find({});
    const members = await TeamMember.find({});
    
    let issues = 0;
    
    // Проверка пользователей без команды
    const usersWithoutTeam = users.filter(user => !user.teamId);
    if (usersWithoutTeam.length > 0) {
      issues++;
    }
    
    // Проверка команд без владельца
    const teamsWithoutOwner = teams.filter(team => !team.ownerId);
    if (teamsWithoutOwner.length > 0) {
      issues++;
    }
    
    // Проверка участников без команды
    const membersWithoutTeam = members.filter(member => !member.teamId);
    if (membersWithoutTeam.length > 0) {
      issues++;
    }
    
    // Проверка участников без пользователя
    const membersWithoutUser = members.filter(member => !member.userId);
    if (membersWithoutUser.length > 0) {
      issues++;
    }
    
    if (issues === 0) {
      } else {
      }
    
  } catch (error) {
    }
}

// Основная функция проверки
async function checkMigration() {
  try {
    await connectDB();
    
    await checkTeams();
    await checkUsers();
    await checkTeamMembers();
    await checkDataIntegrity();
    
    } catch (error) {
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    }
}

// Запуск проверки
if (require.main === module) {
  checkMigration();
}

module.exports = { checkMigration };
