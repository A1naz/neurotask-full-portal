const nodemailer = require('nodemailer');

// Тестируем прямое подключение к IP с правильным hostname
const emailConfig = {
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
  // Важно: указываем правильный hostname для HELO
  name: 'neurotask.ru'
};

async function testEmail() {
  console.log('🔧 Тестируем email с прямым подключением к IP...');
  console.log('📧 Конфигурация:', {
    host: emailConfig.host,
    port: emailConfig.port,
    secure: emailConfig.secure,
    user: emailConfig.auth.user,
    name: emailConfig.name
  });
  
  try {
    // Создаем транспортер
    const transporter = nodemailer.createTransport(emailConfig);
    console.log('✅ Транспортер создан успешно');
    
    // Проверяем соединение
    await transporter.verify();
    console.log('✅ Соединение с SMTP сервером установлено');
    
    // Пробуем отправить тестовое письмо
    const testMailOptions = {
      from: 'info@neurotask.ru',
      to: 'info@neurotask.ru',
      subject: '🧪 Тест email настроек Neurotask',
      text: 'Это тестовое письмо для проверки email конфигурации.',
      html: `
        <h2>🧪 Тест email настроек</h2>
        <p>Конфигурация работает!</p>
        <p>Время: ${new Date().toLocaleString('ru-RU')}</p>
        <p>IP: 31.31.196.41:587</p>
      `
    };
    
    console.log('📤 Отправляем тестовое письмо...');
    const info = await transporter.sendMail(testMailOptions);
    
    console.log('✅ Тестовое письмо отправлено успешно!');
    console.log('📧 Message ID:', info.messageId);
    console.log('📨 Response:', info.response);
    
    console.log('\n🎯 Рабочие настройки для .env файла:');
    console.log('SMTP_HOST=31.31.196.41');
    console.log('SMTP_PORT=587');
    console.log('SMTP_SECURE=false');
    console.log('SMTP_USER=info@neurotask.ru');
    console.log('SMTP_PASS=hU4oJ8h8thyX3M6x');
    console.log('SMTP_NAME=neurotask.ru');
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    
    if (error.code) {
      console.error('🔍 Код ошибки:', error.code);
    }
    
    if (error.response) {
      console.error('📡 Ответ сервера:', error.response);
    }
    
    console.log('\n⚠️  Возможные причины:');
    console.log('  • Неправильные учетные данные');
    console.log('  • SMTP сервер не настроен на порту 587');
    console.log('  • Блокировка порта файрволом');
    console.log('  • SMTP требует аутентификации на других портах');
    console.log('  • Проблема с HELO hostname');
  }
}

// Запускаем тест
testEmail();
