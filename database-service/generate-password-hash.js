const bcrypt = require('bcrypt');

/**
 * Скрипт для генерации хешированного пароля
 * Используйте для создания хеша пароля, который можно вставить в базу данных
 */

async function generatePasswordHash() {
  const password = process.argv[2];
  
  if (!password) {
    console.log('❌ Ошибка: Укажите пароль как аргумент');
    console.log('Пример использования: node generate-password-hash.js "MyPassword123!"');
    return;
  }

  try {
    console.log('🔐 Генерация хеша пароля...\n');
    console.log(`Пароль: ${password}`);
    
    // Генерируем хеш с 12 раундами соли
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    console.log(`\n✅ Хеш сгенерирован успешно!`);
    console.log(`Длина хеша: ${hashedPassword.length} символов`);
    console.log(`\n📋 Хешированный пароль для вставки в базу:`);
    console.log(hashedPassword);
    
    // Проверяем, что хеш работает
    const isValid = await bcrypt.compare(password, hashedPassword);
    console.log(`\n🔍 Проверка хеша: ${isValid ? '✅ Успешно' : '❌ Ошибка'}`);
    
    console.log('\n💡 Инструкция по использованию:');
    console.log('1. Скопируйте хеш выше');
    console.log('2. Выполните MongoDB запрос для обновления пароля:');
    console.log(`   db.users.updateOne(
     { email: "user@example.com" },
     { $set: { password: "${hashedPassword}" } }
   )`);
    
  } catch (error) {
    console.error('❌ Ошибка при генерации хеша:', error.message);
  }
}

// Запускаем генерацию
generatePasswordHash();
