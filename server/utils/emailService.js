const nodemailer = require('nodemailer');

// Логируем переменные окружения при загрузке модуля
console.log('🔧 EmailService loaded:');
console.log('  • NODE_ENV:', process.env.NODE_ENV || 'not set');
console.log('  • SMTP_HOST:', process.env.SMTP_HOST || 'not set');
console.log('  • SMTP_USER:', process.env.SMTP_USER || 'not set');
console.log('  • SMTP_PASS:', process.env.SMTP_PASS ? '***' + process.env.SMTP_PASS.slice(-4) : 'not set');

// Создаем тестовый транспортер (для разработки)
const createTestTransporter = () => {
  // Логируем переменные окружения для отладки
  console.log('🔧 Test SMTP Configuration:');
  console.log('  • SMTP_HOST:', process.env.SMTP_HOST || 'smtp.ethereal.email (fallback)');
  console.log('  • SMTP_PORT:', process.env.SMTP_PORT || '587 (fallback)');
  console.log('  • SMTP_SECURE:', process.env.SMTP_SECURE || 'false (fallback)');
  console.log('  • SMTP_USER:', process.env.SMTP_USER || process.env.EMAIL_USER || 'test@example.com (fallback)');
  console.log('  • SMTP_PASS:', process.env.SMTP_PASS ? '***' + process.env.SMTP_PASS.slice(-4) : process.env.EMAIL_PASS ? '***' + process.env.EMAIL_PASS.slice(-4) : 'test123 (fallback)');
  console.log('  • SMTP_NAME:', process.env.SMTP_NAME || 'neurotask.ru (fallback)');
  
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.ethereal.email',
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_SECURE === 'true' || false,
    auth: {
      user: process.env.SMTP_USER || process.env.EMAIL_USER || 'test@example.com',
      pass: process.env.SMTP_PASS || process.env.EMAIL_PASS || 'test123'
    },
    tls: {
      rejectUnauthorized: process.env.SMTP_TLS_REJECT_UNAUTHORIZED === 'true' || false
    },
    name: process.env.SMTP_NAME || 'neurotask.ru'
  });
};

// Создаем продакшн транспортер (для реального использования)
const createProductionTransporter = () => {
  // Логируем переменные окружения для отладки
  console.log('🔧 SMTP Configuration:');
  console.log('  • SMTP_HOST:', process.env.SMTP_HOST || '31.31.196.41 (default)');
  console.log('  • SMTP_PORT:', process.env.SMTP_PORT || '587 (default)');
  console.log('  • SMTP_SECURE:', process.env.SMTP_SECURE || 'false (default)');
  console.log('  • SMTP_USER:', process.env.SMTP_USER || process.env.EMAIL_USER || 'not set');
  console.log('  • SMTP_PASS:', process.env.SMTP_PASS ? '***' + process.env.SMTP_PASS.slice(-4) : process.env.EMAIL_PASS ? '***' + process.env.EMAIL_PASS.slice(-4) : 'not set');
  console.log('  • SMTP_NAME:', process.env.SMTP_NAME || 'neurotask.ru (default)');
  
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || '31.31.196.41',
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_SECURE === 'true' || false,
    auth: {
      user: process.env.SMTP_USER || process.env.EMAIL_USER,
      pass: process.env.SMTP_PASS || process.env.EMAIL_PASS
    },
    tls: {
      rejectUnauthorized: process.env.SMTP_TLS_REJECT_UNAUTHORIZED === 'true' || false
    },
    name: process.env.SMTP_NAME || 'neurotask.ru'
  });
};

// Получаем транспортер в зависимости от окружения
const getTransporter = () => {
  console.log('🔧 getTransporter called:');
  console.log('  • NODE_ENV:', process.env.NODE_ENV || 'not set');
  
  // Проверяем, есть ли SMTP настройки
  const hasSmtpConfig = process.env.SMTP_HOST || process.env.SMTP_USER || process.env.SMTP_PASS;
  
  if (hasSmtpConfig) {
    console.log('  • SMTP config found, using production transporter...');
    return createProductionTransporter();
  } else {
    console.log('  • No SMTP config, using test transporter...');
    return createTestTransporter();
  }
};

// Отправка кода подтверждения
const sendVerificationEmail = async (email, username, code) => {
  try {
    const transporter = getTransporter();
    
    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.EMAIL_FROM || 'info@neurotask.ru',
      to: email,
              subject: 'Подтверждение email - Neurotask',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
                            <h1 style="color: white; margin: 0;">Neurotask</h1>
          </div>
          
          <div style="padding: 30px; background: #f9f9f9;">
            <h2 style="color: #333; margin-bottom: 20px;">Подтверждение email адреса</h2>
            
            <p style="color: #666; line-height: 1.6;">
              Здравствуйте, <strong>${username}</strong>!
            </p>
            
            <p style="color: #666; line-height: 1.6;">
                              Для завершения регистрации в Neurotask, пожалуйста, введите следующий код подтверждения:
            </p>
            
            <div style="background: #fff; border: 2px solid #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
              <h3 style="color: #667eea; font-size: 32px; letter-spacing: 8px; margin: 0; font-family: monospace;">
                ${code}
              </h3>
            </div>
            
            <p style="color: #666; line-height: 1.6; font-size: 14px;">
              <strong>Важно:</strong> Код действителен в течение 15 минут. Если вы не запрашивали этот код, проигнорируйте это письмо.
            </p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              <p style="color: #999; font-size: 12px; margin: 0;">
                Это автоматическое письмо, не отвечайте на него.
              </p>
            </div>
          </div>
        </div>
      `
    };
    
    const info = await transporter.sendMail(mailOptions);
    
    // Логируем результат отправки
    console.log('📧 Email verification sent successfully:');
    console.log('  • To:', email);
    console.log('  • Username:', username);
    console.log('  • Code:', code);
    console.log('  • Message ID:', info.messageId);
    console.log('  • Response:', info.response);
    
    if (process.env.NODE_ENV !== 'production') {
      console.log('🔍 Email sent (development):', info.messageId);
    }
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    // Логируем ошибку отправки
    console.error('❌ Email verification failed:');
    console.error('  • To:', email);
    console.error('  • Username:', username);
    console.error('  • Error:', error.message);
    console.error('  • Stack:', error.stack);
    
    return { success: false, error: error.message };
  }
};

// Отправка кода повторно
const resendVerificationEmail = async (email, username, code) => {
  return sendVerificationEmail(email, username, code);
};

// Отправка кода сброса пароля
const sendPasswordResetEmail = async (email, username, code) => {
  try {
    const transporter = getTransporter();
    
    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.EMAIL_FROM || 'info@neurotask.ru',
      to: email,
      subject: 'Сброс пароля - Neurotask',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">Neurotask</h1>
          </div>
          
          <div style="padding: 30px; background: #f9f9f9;">
            <h2 style="color: #333; margin-bottom: 20px;">Сброс пароля</h2>
            
            <p style="color: #666; line-height: 1.6;">
              Здравствуйте, <strong>${username}</strong>!
            </p>
            
            <p style="color: #666; line-height: 1.6;">
              Вы запросили сброс пароля для вашей учетной записи Neurotask. Пожалуйста, используйте следующий код для завершения процесса:
            </p>
            
            <div style="background: #fff; border: 2px solid #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
              <h3 style="color: #667eea; font-size: 32px; letter-spacing: 8px; margin: 0; font-family: monospace;">
                ${code}
              </h3>
            </div>
            
            <p style="color: #666; line-height: 1.6; font-size: 14px;">
              <strong>Важно:</strong> Код действителен в течение 1 часа. Если вы не запрашивали сброс пароля, проигнорируйте это письмо.
            </p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              <p style="color: #999; font-size: 12px; margin: 0;">
                Это автоматическое письмо, не отвечайте на него.
              </p>
            </div>
          </div>
        </div>
      `
    };
    
    const info = await transporter.sendMail(mailOptions);
    
    console.log('📧 Password reset email sent successfully:');
    console.log('  • To:', email);
    console.log('  • Username:', username);
    console.log('  • Code:', code);
    console.log('  • Message ID:', info.messageId);
    console.log('  • Response:', info.response);
    
    if (process.env.NODE_ENV !== 'production') {
      console.log('🔍 Email sent (development):', info.messageId);
    }
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Password reset email failed:');
    console.error('  • To:', email);
    console.error('  • Username:', username);
    console.error('  • Error:', error.message);
    console.error('  • Stack:', error.stack);
    
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendVerificationEmail,
  resendVerificationEmail,
  sendPasswordResetEmail
}; 