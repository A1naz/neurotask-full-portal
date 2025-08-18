const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

// Подключаемся к MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/neurotask_app', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Импортируем модель User
const User = require('./models/User');

async function updateUserPassword() {
  const email = process.argv[2];
  const newPassword = process.argv[3];
  
  if (!email || !newPassword) {
    console.log('❌ Ошибка: Укажите email и новый пароль');
    console.log('Пример использования: node update-user-password.js "user@example.com" "NewPassword123!"');
    return;
  }

  try {
    console.log('🔐 Обновление пароля пользователя...\n');
    console.log(`Email: ${email}`);
    console.log(`Новый пароль: ${newPassword}`);
    
    // Находим пользователя
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      console.log('❌ Пользователь не найден');
      return;
    }
    
    console.log(`\n✅ Пользователь найден: ${user.username}`);
    
    // Обновляем пароль (автоматически хешируется через middleware)
    user.password = newPassword;
    await user.save();
    
    console.log('✅ Пароль успешно обновлен и захеширован');
    
    // Проверяем, что новый пароль работает
    const isValid = await user.comparePassword(newPassword);
    console.log(`🔍 Проверка нового пароля: ${isValid ? '✅ Успешно' : '❌ Ошибка'}`);
    
    console.log('\n📋 Информация о пользователе:');
    console.log(`   ID: ${user._id}`);
    console.log(`   Username: ${user.username}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Роль: ${user.role}`);
    console.log(`   Последнее обновление: ${user.updatedAt}`);
    
  } catch (error) {
    console.error('❌ Ошибка при обновлении пароля:', error.message);
  } finally {
    // Закрываем соединение с MongoDB
    await mongoose.connection.close();
    console.log('\n🔌 Соединение с MongoDB закрыто');
  }
}

// Запускаем обновление
updateUserPassword();
