const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcrypt');
const { requireApiKey } = require('../middleware/auth');
const crypto = require('crypto'); // Added for verification code generation
const { sendPasswordResetEmail } = require('../../server/utils/emailService'); // Import email service

// ===== AUTHENTICATION ENDPOINTS =====

// Аутентификация пользователя
router.post('/authenticate', requireApiKey, async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Email и пароль обязательны'
      });
    }

   
    
    // Ищем пользователя по email
    const user = await User.findOne({ email });

    
    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Неверный email или пароль'
      });
    }

    // Проверяем пароль
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Неверный email или пароль'
      });
    }

    // Обновляем время последнего входа
    user.lastLogin = new Date();
    await user.save();

    // Возвращаем пользователя без пароля
    const userResponse = {
      _id: user._id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      balance: user.balance,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin
    };

    res.json({
      success: true,
      message: 'Аутентификация успешна',
      user: userResponse
    });
  } catch (error) {
    console.error('Database Service - Authentication error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Ошибка аутентификации'
    });
  }
});

// Сравнить пароль пользователя
router.post('/compare-password', async (req, res) => {
  try {
    const { candidatePassword, hashedPassword } = req.body;
    
    if (!candidatePassword || !hashedPassword) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'candidatePassword и hashedPassword обязательны'
      });
    }

    const isMatch = await bcrypt.compare(candidatePassword, hashedPassword);
    
    res.json({
      success: true,
      isMatch: isMatch
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Ошибка сравнения пароля'
    });
  }
});

// Сгенерировать код верификации
router.post('/generate-verification-code', async (req, res) => {
  try {
    // Генерируем 6-значный код
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    res.json({
      success: true,
      message: 'Код верификации сгенерирован',
      code: verificationCode
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Ошибка генерации кода верификации'
    });
  }
});

// Запрос на сброс пароля - отправка кода
router.post('/request-password-reset', requireApiKey, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Bad Request', message: 'Email обязателен' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      // Отправлять успешный ответ, чтобы не выдавать информацию о существовании пользователя
      return res.json({ success: true, message: 'Если пользователь с таким email существует, на него будет отправлен код подтверждения.' });
    }

    // Генерируем 6-значный код
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetPasswordToken = resetCode;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 час
    await user.save();

    // Отправляем email с кодом сброса пароля
    await sendPasswordResetEmail(user.email, user.username, resetCode);

    res.json({ success: true, message: 'Код подтверждения отправлен на ваш email.', userId: user._id });
  } catch (error) {
    console.error('Database Service - Request password reset error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Ошибка при запросе сброса пароля' });
  }
});

// Проверка кода сброса пароля
router.post('/verify-reset-code', requireApiKey, async (req, res) => {
  try {
    const { userId, code } = req.body;
    if (!userId || !code) {
      return res.status(400).json({ error: 'Bad Request', message: 'ID пользователя и код обязательны' });
    }

    const user = await User.findOne({
      _id: userId,
      resetPasswordToken: code,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Неверный или просроченный код сброса пароля.' });
    }

    res.json({ success: true, message: 'Код подтвержден.' });
  } catch (error) {
    console.error('Database Service - Verify reset code error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Ошибка при проверке кода сброса пароля' });
  }
});

// Сброс пароля
router.post('/reset-password', requireApiKey, async (req, res) => {
  try {
    const { userId, code, newPassword } = req.body;
    if (!userId || !code || !newPassword) {
      return res.status(400).json({ error: 'Bad Request', message: 'ID пользователя, код и новый пароль обязательны' });
    }

    const user = await User.findOne({
      _id: userId,
      resetPasswordToken: code,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Неверный или просроченный код сброса пароля.' });
    }

    // Устанавливаем новый пароль
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ success: true, message: 'Пароль успешно сброшен.' });
  } catch (error) {
    console.error('Database Service - Reset password error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Ошибка при сбросе пароля' });
  }
});

module.exports = router;
