const express = require('express');
const router = express.Router();
const axios = require('axios');
const { requireAuth } = require('../middleware/auth');

// Импортируем функции из утилит
const utils = require('../utils');
const { 
  comparePassword, 
  generateVerificationCode, 
  toPublicJSON, 
  verifyCode,
  DATABASE_SERVICE_URL,
  DATABASE_SERVICE_API_KEY
} = utils;

// Импортируем email сервисы
const { sendVerificationEmail, resendVerificationEmail } = require('../utils/emailService');

// Регистрация пользователя
router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email и пароль обязательны'
      });
    }

    // Автоматическая генерация имени пользователя
    const baseUsername = email.split('@')[0];
    let username = baseUsername;
    let counter = 1;
    let isUnique = false;

    while (!isUnique) {
      try {
        const existingUserResponse = await axios.get(`${DATABASE_SERVICE_URL}/api/users/username/${username}`, {
          headers: { 'x-api-key': DATABASE_SERVICE_API_KEY }
        });
        
        if (existingUserResponse.data.success) {
          username = `${baseUsername}${counter++}`;
        } else {
          isUnique = true;
        }
      } catch (error) {
        if (error.response && error.response.status === 404) {
          isUnique = true;
        } else {
          throw error;
        }
      }
    }

    // Проверяем, не существует ли уже пользователь с таким email
    try {
      const existingUserResponse = await axios.get(`${DATABASE_SERVICE_URL}/api/users/email/${email}`, {
        headers: { 'x-api-key': DATABASE_SERVICE_API_KEY }
      });

      if (existingUserResponse.data.success) {
        return res.status(400).json({
          success: false,
          message: 'Пользователь с таким email уже существует'
        });
      }
    } catch (error) {
      // Если пользователь не найден (404), это нормально - можно регистрировать
      if (error.response && error.response.status === 404) {
        // Пользователь не найден, продолжаем регистрацию
      } else {
        // Другая ошибка
        throw error;
      }
    }

    // Генерируем код верификации
    const verificationCode = await generateVerificationCode();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 часа

    // Создаем пользователя
    const userData = {
      email,
      password,
      username,
      firstName: firstName || '',
      lastName: lastName || '',
      verificationCode,
      verificationExpires,
      emailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const createUserResponse = await axios.post(`${DATABASE_SERVICE_URL}/api/users`, userData, {
      headers: { 'x-api-key': DATABASE_SERVICE_API_KEY }
    });

    if (!createUserResponse.data.success) {
      throw new Error('Ошибка создания пользователя в database-service');
    }

    const newUser = createUserResponse.data.user;

    // Отправляем email для верификации
    try {
      await sendVerificationEmail(email, newUser.username, verificationCode);
    } catch (emailError) {
      // Удаляем пользователя, если не удалось отправить email
      await axios.delete(`${DATABASE_SERVICE_URL}/api/users/${newUser._id}`, {
        headers: { 'x-api-key': DATABASE_SERVICE_API_KEY }
      });
      
      return res.status(500).json({
        success: false,
        message: 'Ошибка отправки email для верификации'
      });
    }

    res.status(201).json({
      success: true,
      message: 'Пользователь зарегистрирован. Проверьте email для верификации.',
      user: toPublicJSON(newUser)
    });

  } catch (error) {
    console.error('Registration error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      response: error.response?.data
    });
    
    res.status(500).json({
      success: false,
      message: 'Ошибка регистрации пользователя',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Вход в систему
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email и пароль обязательны'
      });
    }

    // Аутентифицируем пользователя через database-service
    const authResponse = await axios.post(`${DATABASE_SERVICE_URL}/api/auth/authenticate`, {
      email,
      password
    }, {
      headers: { 'x-api-key': DATABASE_SERVICE_API_KEY }
    });

    if (!authResponse.data.success) {
      return res.status(401).json({
        success: false,
        message: 'Неверный email или пароль'
      });
    }

    const user = authResponse.data.user;

    // Проверяем верификацию email
    if (!user.emailVerified) {
      return res.status(403).json({
        success: false,
        message: 'Email не верифицирован. Проверьте почту для получения кода верификации.'
      });
    }

    // Создаем сессию
    req.session.userId = user._id;
    req.session.user = toPublicJSON(user);

    res.json({
      success: true,
      message: 'Вход выполнен успешно',
      user: toPublicJSON(user)
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка входа в систему'
    });
  }
});

// Выход пользователя
router.post('/logout', requireAuth, (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Ошибка выхода из системы'
      });
    }
    
    res.json({
      success: true,
      message: 'Выход выполнен успешно'
    });
  });
});

// Верификация email
router.post('/verify-email', async (req, res) => {
  try {
    console.log('🔍 Verify email request body:', req.body);
    const { email, code } = req.body;
    
    if (!email || !code) {
      console.log('❌ Missing email or code:', { email: !!email, code: !!code });
      return res.status(400).json({
        success: false,
        message: 'Email и код верификации обязательны'
      });
    }

    // Находим пользователя по email
    let userResponse;
    try {
      userResponse = await axios.get(`${DATABASE_SERVICE_URL}/api/users/email/${email}`, {
        headers: { 'x-api-key': DATABASE_SERVICE_API_KEY }
      });
    } catch (error) {
      if (error.response && error.response.status === 404) {
        return res.status(404).json({
          success: false,
          message: 'Пользователь не найден'
        });
      }
      throw error;
    }

    if (!userResponse.data.success) {
      return res.status(404).json({
        success: false,
        message: 'Пользователь не найден'
      });
    }

    const user = userResponse.data.user;
    console.log('🔍 User found:', { 
      id: user._id, 
      email: user.email,
      hasVerificationCode: !!user.verificationCode,
      verificationExpires: user.verificationExpires
    });

    // Проверяем код верификации
    console.log('🔍 Verifying code:', { 
      providedCode: code, 
      storedCode: user.verificationCode,
      expires: user.verificationExpires
    });
    
    if (!verifyCode(user, code)) {
      console.log('❌ Code verification failed');
      return res.status(400).json({
        success: false,
        message: 'Неверный код верификации или код истек'
      });
    }
    
    console.log('✅ Code verification successful');

    // Обновляем статус верификации
    await axios.put(`${DATABASE_SERVICE_URL}/api/users/${user._id}`, {
      emailVerified: true,
      verificationCode: null,
      verificationExpires: null
    }, {
      headers: { 'x-api-key': DATABASE_SERVICE_API_KEY }
    });

    // Автоматически создаем сессию после успешной верификации
    req.session.userId = user._id;
    req.session.user = toPublicJSON({
      ...user,
      emailVerified: true,
      verificationCode: null,
      verificationExpires: null
    });

    res.json({
      success: true,
      message: 'Email успешно верифицирован. Вы автоматически вошли в систему.',
      user: req.session.user,
      isAuthenticated: true
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка верификации email'
    });
  }
});

// Повторная отправка кода верификации
router.post('/resend-verification', async (req, res) => {
  try {
    console.log('Resend verification request body:', req.body);
    const { email } = req.body;
    
    if (!email) {
      console.log('Email is missing in request body');
      return res.status(400).json({
        success: false,
        message: 'Email обязателен'
      });
    }

    // Находим пользователя по email
    let userResponse;
    try {
      userResponse = await axios.get(`${DATABASE_SERVICE_URL}/api/users/email/${email}`, {
        headers: { 'x-api-key': DATABASE_SERVICE_API_KEY }
      });
    } catch (error) {
      if (error.response && error.response.status === 404) {
        return res.status(404).json({
          success: false,
          message: 'Пользователь не найден'
        });
      }
      throw error;
    }

    if (!userResponse.data.success) {
      return res.status(404).json({
        success: false,
        message: 'Пользователь не найден'
      });
    }

    const user = userResponse.data.user;

    // Проверяем, не верифицирован ли уже email
    console.log('User emailVerified status:', user.emailVerified);
    if (user.emailVerified) {
      console.log('Email is already verified');
      return res.status(400).json({
        success: false,
        message: 'Email уже верифицирован'
      });
    }

    // Генерируем новый код верификации
    const verificationCode = await generateVerificationCode();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 часа

    // Обновляем код верификации
    await axios.put(`${DATABASE_SERVICE_URL}/api/users/${user._id}`, {
      verificationCode,
      verificationExpires
    }, {
      headers: { 'x-api-key': DATABASE_SERVICE_API_KEY }
    });

    // Отправляем новый email
    console.log('📤 Sending verification email...');
    console.log('  • Email:', email);
    console.log('  • Code:', verificationCode);
    console.log('  • Expires:', verificationExpires);
    
    const emailResult = await resendVerificationEmail(email, user.username || 'User', verificationCode);
    
    if (emailResult.success) {
      console.log('✅ Verification email sent successfully');
      console.log('  • Message ID:', emailResult.messageId);
    } else {
      console.error('❌ Failed to send verification email');
      console.error('  • Error:', emailResult.error);
    }

    res.json({
      success: true,
      message: 'Новый код верификации отправлен на email'
    });

  } catch (error) {
    console.error('❌ Error in resend-verification route:');
    console.error('  • Error:', error.message);
    console.error('  • Stack:', error.stack);
    
    res.status(500).json({
      success: false,
      message: 'Ошибка повторной отправки кода верификации'
    });
  }
});

// Получение информации о текущем пользователе
router.get('/me', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    
    // Получаем пользователя
    const userResponse = await axios.get(`${DATABASE_SERVICE_URL}/api/users/${userId}`, {
      headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
    });

    if (!userResponse.data.success) {
      return res.status(404).json({
        success: false,
        message: 'Пользователь не найден'
      });
    }

    const user = userResponse.data.user;

    res.json({
      success: true,
      user: user // Отправляем полный объект пользователя
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка получения информации о пользователе'
    });
  }
});

// Обновление профиля пользователя
router.put('/profile', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const { firstName, lastName, username, email } = req.body;
    
    // Получаем пользователя
    const userResponse = await axios.get(`${DATABASE_SERVICE_URL}/api/users/${userId}`, {
      headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
    });

    if (!userResponse.data.success) {
      return res.status(404).json({
        success: false,
        message: 'Пользователь не найден'
      });
    }

    const user = userResponse.data.user;

    // Обновляем профиль
    const updateData = {};
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (username !== undefined) updateData.username = username;
    if (email !== undefined) updateData.email = email;

    await axios.put(`${DATABASE_SERVICE_URL}/api/users/${userId}`, updateData, {
      headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
    });

    res.json({
      success: true,
      message: 'Профиль успешно обновлен'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка обновления профиля'
    });
  }
});

// Изменение пароля (POST)
router.post('/change-password', requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.session.userId;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Текущий и новый пароль обязательны'
      });
    }

    // Получаем пользователя
    const userResponse = await axios.get(`${DATABASE_SERVICE_URL}/api/users/${userId}`, {
      headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
    });

    if (!userResponse.data.success) {
      return res.status(404).json({
        success: false,
        message: 'Пользователь не найден'
      });
    }

    const user = userResponse.data.user;

    // Проверяем текущий пароль через endpoint аутентификации
    const authResponse = await axios.post(`${DATABASE_SERVICE_URL}/api/auth/authenticate`, {
      email: user.email,
      password: currentPassword
    }, {
      headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
    });

    if (!authResponse.data.success) {
      return res.status(400).json({
        success: false,
        message: 'Неверный текущий пароль'
      });
    }

    // Обновляем пароль
    await axios.put(`${DATABASE_SERVICE_URL}/api/users/${userId}`, {
      password: newPassword
    }, {
      headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
    });

    res.json({
      success: true,
      message: 'Пароль успешно изменен'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка изменения пароля'
    });
  }
});

// Изменение пароля (PUT)
router.put('/password', requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.session.userId;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Текущий и новый пароль обязательны'
      });
    }

    // Получаем пользователя
    const userResponse = await axios.get(`${DATABASE_SERVICE_URL}/api/users/${userId}`, {
      headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
    });

    if (!userResponse.data.success) {
      return res.status(404).json({
        success: false,
        message: 'Пользователь не найден'
      });
    }

    const user = userResponse.data.user;

    // Проверяем текущий пароль через endpoint аутентификации
    const authResponse = await axios.post(`${DATABASE_SERVICE_URL}/api/auth/authenticate`, {
      email: user.email,
      password: currentPassword
    }, {
      headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
    });

    if (!authResponse.data.success) {
      return res.status(400).json({
        success: false,
        message: 'Неверный текущий пароль'
      });
    }

    // Обновляем пароль
    await axios.put(`${DATABASE_SERVICE_URL}/api/users/${userId}`, {
      password: newPassword
    }, {
      headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
    });

    res.json({
      success: true,
      message: 'Пароль успешно изменен'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка изменения пароля'
    });
  }
});

// Прокси-эндпоинт для запроса сброса пароля
router.post('/request-password-reset', async (req, res) => {
  try {
    const response = await axios.post(`${DATABASE_SERVICE_URL}/api/auth/request-password-reset`, req.body, {
      headers: { 'x-api-key': DATABASE_SERVICE_API_KEY }
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Server - Proxy request-password-reset error:', error);
    res.status(error.response?.status || 500).json(error.response?.data || { success: false, message: 'Ошибка проксирования запроса сброса пароля' });
  }
});

// Прокси-эндпоинт для проверки кода сброса пароля
router.post('/verify-reset-code', async (req, res) => {
  try {
    const response = await axios.post(`${DATABASE_SERVICE_URL}/api/auth/verify-reset-code`, req.body, {
      headers: { 'x-api-key': DATABASE_SERVICE_API_KEY }
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Server - Proxy verify-reset-code error:', error);
    res.status(error.response?.status || 500).json(error.response?.data || { success: false, message: 'Ошибка проксирования проверки кода сброса пароля' });
  }
});

// Прокси-эндпоинт для сброса пароля
router.post('/reset-password', async (req, res) => {
  try {
    const response = await axios.post(`${DATABASE_SERVICE_URL}/api/auth/reset-password`, req.body, {
      headers: { 'x-api-key': DATABASE_SERVICE_API_KEY }
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Server - Proxy reset-password error:', error);
    res.status(error.response?.status || 500).json(error.response?.data || { success: false, message: 'Ошибка проксирования сброса пароля' });
  }
});

module.exports = router;
