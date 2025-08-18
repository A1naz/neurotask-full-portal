const nodemailer = require('nodemailer');

// Тестируем различные варианты аутентификации
const authVariants = [
  {
    name: 'Полный email как логин',
    host: '31.31.196.41',
    port: 587,
    secure: false,
    auth: {
      user: 'info@neurotask.ru',
      pass: 'hU4oJ8h8thyX3M6x'
    },
    tls: {
      rejectUnauthorized: false
    },
    name: 'neurotask.ru'
  },
  {
    name: 'Только username (без домена)',
    host: '31.31.196.41',
    port: 587,
    secure: false,
    auth: {
      user: 'info',
      pass: 'hU4oJ8h8thyX3M6x'
    },
    tls: {
      rejectUnauthorized: false
    },
    name: 'neurotask.ru'
  },
  {
    name: 'Порт 465 (SSL)',
    host: '31.31.196.41',
    port: 465,
    secure: true,
    auth: {
      user: 'info@neurotask.ru',
      pass: 'hU4oJ8h8thyX3M6x'
    },
    tls: {
      rejectUnauthorized: false
    },
    name: 'neurotask.ru'
  },
  {
    name: 'Порт 25 (без SSL)',
    host: '31.31.196.41',
    port: 25,
    secure: false,
    auth: {
      user: 'info@neurotask.ru',
      pass: 'hU4oJ8h8thyX3M6x'
    },
    tls: {
      rejectUnauthorized: false
    },
    name: 'neurotask.ru'
  }
];

async function testAuthVariant(config) {
  console.log(`\n🔧 Тестируем: ${config.name}`);
  console.log(`📧 Конфигурация: ${config.host}:${config.port} (secure: ${config.secure})`);
  console.log(`👤 Логин: ${config.auth.user}`);
  
  try {
    // Создаем транспортер
    const transporter = nodemailer.createTransport(config);
    console.log('✅ Транспортер создан успешно');
    
    // Проверяем соединение
    await transporter.verify();
    console.log('✅ Соединение с SMTP сервером установлено');
    
    // Пробуем отправить тестовое письмо
    const testMailOptions = {
      from: 'info@neurotask.ru',
      to: 'info@neurotask.ru',
      subject: '🧪 Тест email настроек Neurotask',
      text: `Тест конфигурации: ${config.name}`,
      html: `
        <h2>🧪 Тест email настроек</h2>
        <p>Конфигурация: <strong>${config.name}</strong></p>
        <p>Сервер: <strong>${config.host}:${config.port}</strong></p>
        <p>Время: <strong>${new Date().toLocaleString('ru-RU')}</strong></p>
        <p>Статус: <strong style="color: green;">✅ Работает!</strong></p>
      `
    };
    
    console.log('📤 Отправляем тестовое письмо...');
    const info = await transporter.sendMail(testMailOptions);
    
    console.log('✅ Тестовое письмо отправлено успешно!');
    console.log('📧 Message ID:', info.messageId);
    console.log('📨 Response:', info.response);
    
    return { success: true, config: config.name, info };
    
  } catch (error) {
    console.error(`❌ Ошибка: ${error.message}`);
    
    if (error.code) {
      console.error('🔍 Код ошибки:', error.code);
    }
    
    if (error.response) {
      console.error('📡 Ответ сервера:', error.response);
    }
    
    return { success: false, config: config.name, error: error.message };
  }
}

async function runAllTests() {
  console.log('🚀 Тестируем различные варианты аутентификации...\n');
  console.log('📋 Проблема: 535 Incorrect authentication data');
  console.log('🔍 Тестируем: разные логины, порты, SSL настройки\n');
  
  const results = [];
  
  for (const config of authVariants) {
    const result = await testAuthVariant(config);
    results.push(result);
    
    // Небольшая пауза между тестами
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n📊 Результаты тестирования:');
  console.log('========================');
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  if (successful.length > 0) {
    console.log(`\n✅ Успешные конфигурации (${successful.length}):`);
    successful.forEach(r => {
      console.log(`  • ${r.config}`);
    });
    
    console.log('\n🎯 Рекомендуемые настройки для production:');
    const bestConfig = successful[0];
    console.log(`  • Host: ${bestConfig.info?.config?.host || 'неизвестно'}`);
    console.log(`  • Port: ${bestConfig.info?.config?.port || 'неизвестно'}`);
    console.log(`  • Secure: ${bestConfig.info?.config?.secure || 'неизвестно'}`);
    console.log(`  • User: ${bestConfig.info?.config?.auth?.user || 'неизвестно'}`);
  }
  
  if (failed.length > 0) {
    console.log(`\n❌ Неудачные конфигурации (${failed.length}):`);
    failed.forEach(r => {
      console.log(`  • ${r.config}: ${r.error}`);
    });
  }
  
  if (successful.length === 0) {
    console.log('\n⚠️  Все варианты аутентификации не работают.');
    console.log('🔍 Возможные причины:');
    console.log('  • Пароль изменился');
    console.log('  • Неправильный формат логина');
    console.log('  • SMTP требует специальной настройки');
    console.log('  • Проблема с правами доступа');
    console.log('\n💡 Рекомендации:');
    console.log('  • Проверьте пароль в почтовом клиенте');
    console.log('  • Убедитесь, что логин указан правильно');
    console.log('  • Попробуйте создать новое письмо в клиенте');
  }
}

// Запускаем все тесты
runAllTests();
