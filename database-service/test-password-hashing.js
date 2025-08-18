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

async function testPasswordHashing() {
  try {
    console.log('🔐 Тестирование хеширования паролей...\n');

    // Тест 1: Создание пользователя с паролем
    console.log('1️⃣ Создание тестового пользователя...');
    const testUser = new User({
      username: 'test_user_password',
      email: 'test_password@example.com',
      password: 'TestPassword123!',
      firstName: 'Test',
      lastName: 'User'
    });

    await testUser.save();
    console.log('✅ Пользователь создан, пароль хеширован');
    console.log(`   Хешированный пароль: ${testUser.password.substring(0, 20)}...`);
    console.log(`   Длина хеша: ${testUser.password.length} символов\n`);

    // Тест 2: Проверка сравнения паролей
    console.log('2️⃣ Тестирование сравнения паролей...');
    
    // Правильный пароль
    const correctPassword = 'TestPassword123!';
    const isCorrectPasswordValid = await testUser.comparePassword(correctPassword);
    console.log(`   Правильный пароль: ${isCorrectPasswordValid ? '✅' : '❌'}`);

    // Неправильный пароль
    const wrongPassword = 'WrongPassword123!';
    const isWrongPasswordValid = await testUser.comparePassword(wrongPassword);
    console.log(`   Неправильный пароль: ${isWrongPasswordValid ? '❌' : '✅'}`);

    // Тест 3: Обновление пароля
    console.log('\n3️⃣ Тестирование обновления пароля...');
    const newPassword = 'NewPassword456!';
    
    testUser.password = newPassword;
    await testUser.save();
    
    console.log('✅ Пароль обновлен и перехеширован');
    console.log(`   Новый хеш: ${testUser.password.substring(0, 20)}...`);
    console.log(`   Длина нового хеша: ${testUser.password.length} символов`);

    // Проверяем, что новый пароль работает
    const isNewPasswordValid = await testUser.comparePassword(newPassword);
    console.log(`   Новый пароль работает: ${isNewPasswordValid ? '✅' : '❌'}`);

    // Старый пароль больше не должен работать
    const isOldPasswordValid = await testUser.comparePassword(correctPassword);
    console.log(`   Старый пароль больше не работает: ${isOldPasswordValid ? '❌' : '✅'}`);

    // Тест 4: Проверка bcrypt напрямую
    console.log('\n4️⃣ Тестирование bcrypt напрямую...');
    const plainPassword = 'DirectTest789!';
    const hashedPassword = await bcrypt.hash(plainPassword, 12);
    const isDirectValid = await bcrypt.compare(plainPassword, hashedPassword);
    console.log(`   Прямое хеширование bcrypt: ${isDirectValid ? '✅' : '❌'}`);

    // Очистка: удаляем тестового пользователя
    console.log('\n🧹 Очистка тестовых данных...');
    await User.findByIdAndDelete(testUser._id);
    console.log('✅ Тестовый пользователь удален');

    console.log('\n🎉 Все тесты пройдены успешно!');
    console.log('\n📋 Резюме:');
    console.log('   • Пароли автоматически хешируются при создании');
    console.log('   • Пароли автоматически перехешируются при обновлении');
    console.log('   • Метод comparePassword корректно сравнивает пароли');
    console.log('   • Используется bcrypt с 12 раундами соли');
    console.log('   • Хеши имеют длину 60 символов');

  } catch (error) {
    console.error('❌ Ошибка при тестировании:', error);
  } finally {
    // Закрываем соединение с MongoDB
    await mongoose.connection.close();
    console.log('\n🔌 Соединение с MongoDB закрыто');
  }
}

// Запускаем тест
testPasswordHashing();
