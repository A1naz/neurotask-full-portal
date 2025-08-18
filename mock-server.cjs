// Загрузка переменных окружения
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 3001;

// Переменные окружения
const NODE_ENV = process.env.NODE_ENV || 'development';
const SESSION_SECRET = process.env.SESSION_SECRET || 'your-secret-key';
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : ['http://localhost:5173', 'http://localhost:5174', 'https://neurotask.ru'];

console.log('=== Mock Server Configuration ===');
console.log('NODE_ENV:', NODE_ENV);
console.log('PORT:', PORT);
console.log('ALLOWED_ORIGINS:', ALLOWED_ORIGINS);
console.log('SESSION_SECRET:', SESSION_SECRET ? '***' : 'not set');

// CORS настройки
app.use(cors({
  origin: ALLOWED_ORIGINS,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Настройка сессии
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: NODE_ENV === 'production', // true только в продакшене
    sameSite: 'lax',
    domain: NODE_ENV === 'development' ? 'localhost' : '.neurotask.ru',
    path: '/',
    maxAge: 24 * 60 * 60 * 1000 // 24 часа
  }
}));

// Парсинг JSON
app.use(express.json());

// Логирование запросов
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Мок данные пользователей (вместо MongoDB)
const users = [
  {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    balance: 1000,
    emailVerified: true,
    aiProviders: {
      openai: false,
      gemini: false,
      xai: false,
      yandexgpt: false,
      gigachat: false,
      anthropic: false,
      deepseek: false
    },
    createdAt: new Date().toISOString()
  }
];

// Мок коды верификации (в реальном приложении хранились бы в базе данных)
const verificationCodes = new Map();

// Middleware для проверки аутентификации
const requireAuth = (req, res, next) => {
  if (req.session.userId) {
    next();
  } else {
    res.status(401).json({ message: 'Unauthorized' });
  }
};

// Ping endpoint для проверки работы сервера
app.get('/api/ping', (req, res) => {
  res.json({ 
    message: 'Server is running!', 
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    sessionId: req.sessionID
  });
});

// Проверка аутентификации
app.get('/api/auth/me', requireAuth, (req, res) => {
  const user = users.find(u => u.id === req.session.userId);
  if (user) {
    res.json({ user });
  } else {
    res.status(401).json({ message: 'User not found' });
  }
});

// Регистрация
app.post('/api/auth/register', (req, res) => {
  const { username, email, password } = req.body;
  
  if (!username || !email || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }
  
  const existingUser = users.find(u => u.email === email);
  if (existingUser) {
    return res.status(400).json({ message: 'User already exists' });
  }
  
  // Validate password strength (soft validation for testing)
  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters long' });
  }
  
  const newUser = {
    id: users.length + 1,
    username,
    email,
    balance: 1000,
    emailVerified: false,
    aiProviders: {
      openai: false,
      gemini: false,
      xai: false,
      yandexgpt: false,
      gigachat: false,
      anthropic: false,
      deepseek: false
    },
    createdAt: new Date().toISOString()
  };
  
  users.push(newUser);
  
  // Generate verification code (6 digits)
  const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
  verificationCodes.set(newUser.id, {
    code: verificationCode,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
  });
  
  console.log('User registered:', { id: newUser.id, email: newUser.email });
  console.log('Verification code for', newUser.email, ':', verificationCode);
  
  res.json({ 
    user: newUser,
    message: 'Registration successful. Please check your email for verification code.' 
  });
});

// Верификация email
app.post('/api/auth/verify-email', (req, res) => {
  const { userId, code } = req.body;
  
  if (!userId || !code) {
    return res.status(400).json({ message: 'User ID and verification code are required' });
  }
  
  const user = users.find(u => u.id === userId);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  
  const verificationData = verificationCodes.get(userId);
  if (!verificationData) {
    return res.status(400).json({ message: 'Verification code not found or expired' });
  }
  
  if (new Date() > verificationData.expiresAt) {
    verificationCodes.delete(userId);
    return res.status(400).json({ message: 'Verification code has expired' });
  }
  
  if (verificationData.code !== code) {
    return res.status(400).json({ message: 'Invalid verification code' });
  }
  
  // Mark user as verified and set session
  user.emailVerified = true;
  req.session.userId = user.id;
  verificationCodes.delete(userId);
  
  console.log('Email verified for user:', { id: user.id, email: user.email });
  
  res.json({ 
    user,
    message: 'Email verified successfully' 
  });
});

// Вход
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }
  
  const user = users.find(u => u.email === email);
  if (!user || password !== 'password') { // Простая проверка для демо
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  
  // Check if email is verified (except for test user)
  if (!user.emailVerified && user.email !== 'test@example.com') {
    return res.status(401).json({ message: 'Please verify your email before logging in' });
  }
  
  req.session.userId = user.id;
  
  console.log('User logged in:', { id: user.id, email: user.email });
  
  res.json({ 
    user,
    message: 'Login successful' 
  });
});

// Выход
app.post('/api/auth/logout', (req, res) => {
  const userId = req.session.userId;
  
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ message: 'Logout failed' });
    }
    
    console.log('User logged out:', { id: userId });
    res.json({ message: 'Logout successful' });
  });
});

// Обновление профиля
app.put('/api/auth/profile', requireAuth, (req, res) => {
  const { username, email } = req.body;
  const user = users.find(u => u.id === req.session.userId);
  
  if (user) {
    user.username = username || user.username;
    user.email = email || user.email;
    res.json({ user });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
});

// Смена пароля
app.put('/api/auth/password', requireAuth, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  
  if (currentPassword !== 'password') { // Простая проверка для демо
    return res.status(400).json({ message: 'Current password is incorrect' });
  }
  
  res.json({ message: 'Password changed successfully' });
});

// Эндпоинты для токенов
app.get('/api/tokens/balance', requireAuth, (req, res) => {
  const user = users.find(u => u.id === req.session.userId);
  if (user) {
    res.json({ balance: user.balance });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
});

app.get('/api/tokens/history', requireAuth, (req, res) => {
  // Мок история транзакций
  const history = [
    {
      id: 1,
      type: 'purchase',
      amount: 500,
      description: 'Пополнение баланса',
      date: new Date().toISOString()
    },
    {
      id: 2,
      type: 'usage',
      amount: -50,
      description: 'Использование токенов',
      date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    }
  ];
  
  res.json({ history });
});

// Эндпоинты для дашборда
app.get('/api/dashboard/data', requireAuth, (req, res) => {
  const user = users.find(u => u.id === req.session.userId);
  res.json({
    user,
    stats: {
      totalRequests: 150,
      successRate: 95.5,
      averageResponseTime: 2.3
    }
  });
});

app.get('/api/dashboard/bot-stats', requireAuth, (req, res) => {
  res.json({
    activeBots: 3,
    totalMessages: 1250,
    todayMessages: 45,
    averageResponseTime: 1.8
  });
});

app.get('/api/dashboard/tokens', requireAuth, (req, res) => {
  const user = users.find(u => u.id === req.session.userId);
  res.json({
    balance: user.balance,
    usage: {
      today: 25,
      week: 150,
      month: 650
    }
  });
});

app.get('/api/dashboard/google-auth-status', requireAuth, (req, res) => {
  res.json({
    connected: true,
    email: 'test@example.com',
    lastSync: new Date().toISOString()
  });
});

// Эндпоинты для AI настроек
app.get('/api/ai-settings', requireAuth, (req, res) => {
  const user = users.find(u => u.id === req.session.userId);
  res.json({
    aiProviders: user.aiProviders || {
      openai: false,
      gemini: false,
      xai: false,
      yandexgpt: false,
      gigachat: false,
      anthropic: false,
      deepseek: false
    }
  });
});

app.post('/api/ai-settings', requireAuth, (req, res) => {
  const { aiProviders } = req.body;
  const user = users.find(u => u.id === req.session.userId);
  
  if (user) {
    user.aiProviders = aiProviders;
    res.json({ 
      success: true, 
      aiProviders: user.aiProviders,
      message: 'Настройки AI обновлены успешно!'
    });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
});

// Обработка ошибок
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

// 404 для неизвестных маршрутов
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Запуск сервера
app.listen(PORT, () => {
  console.log('=== Mock Server Started ===');
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api`);
  console.log('Test credentials: test@example.com / password');
  console.log('Environment:', NODE_ENV);
  console.log('========================');
}); 