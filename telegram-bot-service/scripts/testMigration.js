const mongoose = require('mongoose');
const User = require('../models/User');
const Team = require('../models/Team');
const TeamMember = require('../models/TeamMember');
require('dotenv').config();

// Подключение к тестовой базе данных
async function connectTestDB() {
  try {
    const mongoUri = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/telegram_bot_test';
    await mongoose.connect(mongoUri);
    } catch (error) {
    process.exit(1);
  }
}

// Создание тестовых данных
async function createTestData() {
  try {
    // Очищаем существующие данные
    await User.deleteMany({});
    await Team.deleteMany({});
    await TeamMember.deleteMany({});
    
    // Создаем тестовых пользователей
    const testUsers = [
      {
        telegramId: '111111111',
        username: 'testuser1',
        email: 'test1@example.com',
        password: 'testpass123',
        teamRole: 'member'
      },
      {
        telegramId: '222222222',
        username: 'testuser2',
        email: 'test2@example.com',
        password: 'testpass123',
        teamRole: 'member'
      },
      {
        telegramId: '333333333',
        username: 'testuser3',
        email: 'test3@example.com',
        password: 'testpass123',
        teamRole: 'member'
      }
    ];
    
    const createdUsers = [];
    for (const userData of testUsers) {
      const user = new User(userData);
      const savedUser = await user.save();
      createdUsers.push(savedUser);
      }
    
    return createdUsers;
    
  } catch (error) {
    throw error;
  }
}

// Тестирование миграции
async function testMigration() {
  try {
    await connectTestDB();
    
    const testUsers = await createTestData();
    
    const { migrateTeams } = require('./migrateTeams');
    
    await migrateTeams();
    
    await verifyMigrationResults();
    
    } catch (error) {
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    }
}

// Проверка результатов миграции
async function verifyMigrationResults() {
  try {
    // Проверяем команду
    const team = await Team.findOne({ name: 'Основная команда' });
    if (!team) {
      throw new Error('Команда по умолчанию не найдена');
    }
    // Проверяем владельца команды
    if (!team.ownerId) {
      throw new Error('Владелец команды не назначен');
    }
    // Проверяем пользователей
    const users = await User.find({});
    if (users.length === 0) {
      throw new Error('Пользователи не найдены');
    }
    
    // Проверяем, что все пользователи имеют teamId
    const usersWithoutTeam = users.filter(user => !user.teamId);
    if (usersWithoutTeam.length > 0) {
      throw new Error(`Пользователи без команды: ${usersWithoutTeam.map(u => u.username).join(', ')}`);
    }
    // Проверяем участников команды
    const members = await TeamMember.find({ teamId: team._id });
    if (members.length !== users.length) {
      throw new Error(`Количество участников (${members.length}) не соответствует количеству пользователей (${users.length})`);
    }
    // Проверяем роли
    const ownerMember = members.find(m => m.role === 'owner');
    if (!ownerMember) {
      throw new Error('Участник с ролью owner не найден');
    }
    const memberMembers = members.filter(m => m.role === 'member');
    if (memberMembers.length !== users.length - 1) {
      throw new Error(`Количество участников с ролью member (${memberMembers.length}) не соответствует ожидаемому (${users.length - 1})`);
    }
    } catch (error) {
    throw error;
  }
}

// Запуск тестирования
if (require.main === module) {
  testMigration();
}

module.exports = { testMigration };
