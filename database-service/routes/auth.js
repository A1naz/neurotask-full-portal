const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcrypt');
const { requireApiKey } = require('../middleware/auth');

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

module.exports = router;
