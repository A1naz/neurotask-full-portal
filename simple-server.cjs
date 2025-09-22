const express = require('express');
const cors = require('cors');
const session = require('express-session');

const app = express();
const PORT = 3001;

console.log('=== Simple Mock Server ===');

// CORS настройки
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'https://neurotask.ru'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Настройка сессии
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false, // false для HTTP в разработке
    sameSite: 'lax', // lax для HTTP, none только для HTTPS
    path: '/',
    maxAge: 24 * 60 * 60 * 1000, // 24 часа
    domain: undefined // автоматическое определение домена
  }
}));

// Парсинг JSON
app.use(express.json());

// Логирование запросов
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - SessionID: ${req.sessionID}`);
  console.log(`Headers: Origin=${req.headers.origin}, Cookie=${req.headers.cookie ? 'present' : 'missing'}`);
  next();
});

// Мок данные пользователей
const users = [
  {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    balance: 1000
  }
];

// Middleware для проверки аутентификации
const requireAuth = (req, res, next) => {
  if (req.session.userId) {
    next();
  } else {
    res.status(401).json({ message: 'Unauthorized' });
  }
};

// Ping endpoint
app.get('/api/ping', (req, res) => {
  res.json({ 
    message: 'Server is running!', 
    timestamp: new Date().toISOString(),
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
  
  const newUser = {
    id: users.length + 1,
    username,
    email,
    balance: 1000
  };
  
  users.push(newUser);
  req.session.userId = newUser.id;
  
  console.log('User registered:', { id: newUser.id, email: newUser.email });
  
  res.json({ 
    user: newUser,
    message: 'Registration successful' 
  });
});

// Вход
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }
  
  const user = users.find(u => u.email === email);
  if (!user || password !== 'password') {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  
  req.session.userId = user.id;
  
  console.log('User logged in:', { id: user.id, email: user.email });
  console.log('Session cookie settings:', {
    sessionId: req.sessionID,
    cookie: req.session.cookie
  });
  
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
  
  if (currentPassword !== 'password') {
    return res.status(400).json({ message: 'Current password is incorrect' });
  }
  
  res.json({ message: 'Password changed successfully' });
});

// Mock token history data
const tokenHistory = new Map();

// Get token balance
app.get('/api/tokens/balance', requireAuth, (req, res) => {
  const user = users.find(u => u.id === req.session.userId);
  if (user) {
    res.json({ balance: user.balance || 0 });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
});

// Get token history
app.get('/api/tokens/history', requireAuth, (req, res) => {
  const userId = req.session.userId;
  let userHistory = tokenHistory.get(userId) || [];

  // Filtering logic from export functionality can be reused here if needed
  const { period, startDate, endDate, type, fetchAll, page = 1, limit = 20 } = req.query;

  // Simple filtering example (can be expanded)
  if (type && type !== 'all') {
    userHistory = userHistory.filter(t => t.type === type);
  }

  if (fetchAll === 'true') {
    return res.json({ transactions: userHistory });
  }

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const totalItems = userHistory.length;
  const totalPages = Math.ceil(totalItems / limitNum);
  const startIndex = (pageNum - 1) * limitNum;
  const endIndex = pageNum * limitNum;
  const paginatedHistory = userHistory.slice(startIndex, endIndex);

  res.json({ 
    transactions: paginatedHistory,
    totalPages,
    currentPage: pageNum,
    totalItems
  });
});

// Top up tokens
app.post('/api/tokens/top-up', requireAuth, (req, res) => {
  const { amount } = req.body;
  const user = users.find(u => u.id === req.session.userId);
  
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  
  if (!amount || amount <= 0) {
    return res.status(400).json({ message: 'Invalid amount' });
  }
  
  const oldBalance = user.balance || 0;
  user.balance = oldBalance + amount;
  
  // Add to history
  const historyEntry = {
    _id: Date.now().toString(),
    type: 'top_up',
    amount: amount,
    balanceAfter: user.balance,
    description: 'Пополнение баланса',
    createdAt: new Date().toISOString()
  };
  
  const userHistory = tokenHistory.get(req.session.userId) || [];
  userHistory.unshift(historyEntry);
  tokenHistory.set(req.session.userId, userHistory);
  
  console.log('Token top-up:', { userId: req.session.userId, amount, newBalance: user.balance });
  
  res.json({ 
    message: 'Balance topped up successfully',
    newBalance: user.balance
  });
});

// Spend tokens (for future use)
app.post('/api/tokens/spend', requireAuth, (req, res) => {
  const { amount, description } = req.body;
  const user = users.find(u => u.id === req.session.userId);
  
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  
  if (!amount || amount <= 0) {
    return res.status(400).json({ message: 'Invalid amount' });
  }
  
  if (user.balance < amount) {
    return res.status(400).json({ message: 'Insufficient balance' });
  }
  
  const oldBalance = user.balance;
  user.balance = oldBalance - amount;
  
  // Add to history
  const historyEntry = {
    _id: Date.now().toString(),
    type: 'spend',
    amount: amount,
    balanceAfter: user.balance,
    description: description || 'Списание токенов',
    createdAt: new Date().toISOString()
  };
  
  const userHistory = tokenHistory.get(req.session.userId) || [];
  userHistory.unshift(historyEntry);
  tokenHistory.set(req.session.userId, userHistory);
  
  console.log('Token spend:', { userId: req.session.userId, amount, newBalance: user.balance });
  
  res.json({ 
    message: 'Tokens spent successfully',
    newBalance: user.balance
  });
});

// Mock AI settings data
const aiSettings = new Map();

// Get AI settings
app.get('/api/ai-settings', requireAuth, (req, res) => {
  const userId = req.session.userId;
  const userSettings = aiSettings.get(userId) || {
    apiKeys: {
      openai: '',
      gemini: '',
      xai: '',
      yandexgpt: '',
      gigachat: '',
      anthropic: '',
      mistral: '',
      cohere: '',
      huggingface: '',
      replicate: '',
      deepseek: ''
    }
  };
  res.json(userSettings);
});

// Save AI settings
app.post('/api/ai-settings', requireAuth, (req, res) => {
  const { apiKeys } = req.body;
  const userId = req.session.userId;
  
  if (!apiKeys) {
    return res.status(400).json({ message: 'API keys are required' });
  }
  
  // Validate API keys (basic validation)
  const validProviders = [
    'openai', 'gemini', 'xai', 'yandexgpt', 'gigachat',
    'anthropic', 'mistral', 'cohere', 'huggingface', 'replicate', 'deepseek'
  ];
  
  const validatedKeys = {};
  validProviders.forEach(provider => {
    validatedKeys[provider] = apiKeys[provider] || '';
  });
  
  const userSettings = {
    apiKeys: validatedKeys,
    updatedAt: new Date().toISOString()
  };
  
  aiSettings.set(userId, userSettings);
  
  console.log('AI settings saved:', { userId, providers: Object.keys(validatedKeys).filter(key => validatedKeys[key]) });
  
  res.json({ 
    message: 'AI settings saved successfully',
    settings: userSettings
  });
});

// Test AI API key
app.post('/api/ai-settings/test', requireAuth, (req, res) => {
  const { provider, apiKey } = req.body;
  const userId = req.session.userId;
  
  if (!provider || !apiKey) {
    return res.status(400).json({ message: 'Provider and API key are required' });
  }
  
  // Simulate API testing with different providers
  const testResults = {
    openai: {
      success: apiKey.startsWith('sk-'),
      message: apiKey.startsWith('sk-') ? 'OpenAI API key is valid' : 'Invalid OpenAI API key format',
      models: ['gpt-4', 'gpt-3.5-turbo', 'dall-e-3']
    },
    gemini: {
      success: apiKey.startsWith('AIza'),
      message: apiKey.startsWith('AIza') ? 'Google Gemini API key is valid' : 'Invalid Google API key format',
      models: ['gemini-pro', 'gemini-flash']
    },
    xai: {
      success: apiKey.startsWith('xai-'),
      message: apiKey.startsWith('xai-') ? 'xAI API key is valid' : 'Invalid xAI API key format',
      models: ['grok-beta']
    },
    yandexgpt: {
      success: apiKey.startsWith('AQVN'),
      message: apiKey.startsWith('AQVN') ? 'Yandex GPT API key is valid' : 'Invalid Yandex API key format',
      models: ['yandexgpt-lite', 'yandexgpt']
    },
    gigachat: {
      success: apiKey.startsWith('Bearer'),
      message: apiKey.startsWith('Bearer') ? 'GigaChat API key is valid' : 'Invalid GigaChat API key format',
      models: ['GigaChat:latest']
    },
    anthropic: {
      success: apiKey.startsWith('sk-ant-'),
      message: apiKey.startsWith('sk-ant-') ? 'Anthropic API key is valid' : 'Invalid Anthropic API key format',
      models: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku']
    },
    mistral: {
      success: apiKey.startsWith('mistral-'),
      message: apiKey.startsWith('mistral-') ? 'Mistral AI API key is valid' : 'Invalid Mistral API key format',
      models: ['mistral-large', 'mistral-medium', 'mistral-small']
    },
    cohere: {
      success: apiKey.startsWith('cohere-'),
      message: apiKey.startsWith('cohere-') ? 'Cohere API key is valid' : 'Invalid Cohere API key format',
      models: ['command', 'command-r']
    },
    huggingface: {
      success: apiKey.startsWith('hf_'),
      message: apiKey.startsWith('hf_') ? 'Hugging Face API key is valid' : 'Invalid Hugging Face API key format',
      models: ['meta-llama/Llama-2-70b-chat-hf', 'microsoft/DialoGPT-medium']
    },
    replicate: {
      success: apiKey.startsWith('r8_'),
      message: apiKey.startsWith('r8_') ? 'Replicate API key is valid' : 'Invalid Replicate API key format',
      models: ['meta/llama-2-70b-chat', 'stability-ai/stable-diffusion']
    },
    deepseek: {
      success: apiKey.startsWith('sk-'),
      message: apiKey.startsWith('sk-') ? 'DeepSeek API key is valid' : 'Invalid DeepSeek API key format',
      models: ['deepseek-coder', 'deepseek-chat']
    }
  };
  
  const result = testResults[provider];
  if (!result) {
    return res.status(400).json({ message: 'Unknown provider' });
  }
  
  // Simulate network delay
  setTimeout(() => {
    console.log('API key test:', { userId, provider, success: result.success });
    
    res.json({
      success: result.success,
      message: result.message,
      models: result.models,
      provider: provider
    });
  }, 1000);
});

// Запуск сервера
app.listen(PORT, () => {
  console.log('=== Simple Mock Server Started ===');
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api`);
  console.log('Test credentials: test@example.com / password');
  console.log('========================');
}); 