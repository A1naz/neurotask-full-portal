# 🤝 Руководство по участию в разработке

## Добро пожаловать! 👋

Спасибо, что решили внести свой вклад в проект Neurotask - AI Agents for Business! Этот документ содержит всю необходимую информацию для начала работы.

## 📋 Содержание

- [Быстрый старт](#быстрый-старт)
- [Структура проекта](#структура-проекта)
- [Процесс разработки](#процесс-разработки)
- [Стандарты кода](#стандарты-кода)
- [Тестирование](#тестирование)
- [Отправка изменений](#отправка-изменений)
- [Создание Issues](#создание-issues)
- [Создание Pull Requests](#создание-pull-requests)
- [Коммуникация](#коммуникация)

## 🚀 Быстрый старт

### Предварительные требования

- **Node.js** 18.x LTS или выше
- **npm** 8.x или выше
- **Git** 2.30+
- **MongoDB** 6.0+ (для локальной разработки)
- **Redis** 6.2+ (для локальной разработки)

### Установка

1. **Клонируйте репозиторий**
   ```bash
   git clone https://gitlab.company.com/neurotask-ai-agents.git
cd neurotask-ai-agents
   ```

2. **Установите зависимости**
   ```bash
   npm ci
   cd server && npm ci
   cd ../database-service && npm ci
   cd ../cache-service && npm ci
   cd ../balance-service && npm ci
   cd ../telegram-bot-service && npm ci
   cd ../ai-gateway-service && npm ci
   cd ../openai-service && npm ci
   cd ../gemini-service && npm ci
   cd ../anthropic-service && npm ci
   cd ../xai-service && npm ci
   cd ../deepseek-service && npm ci
   cd ../gigachat-service && npm ci
   cd ../yandexgpt-service && npm ci
   ```

3. **Настройте переменные окружения**
   ```bash
   cp configs/development.env.example configs/development.env
   # Отредактируйте файл с вашими настройками
   ```

4. **Запустите базы данных**
   ```bash
   # MongoDB
   sudo systemctl start mongod
   
   # Redis
   sudo systemctl start redis
   ```

5. **Запустите сервисы**
   ```bash
   # В разных терминалах
   npm run dev:server
   npm run dev:database
   npm run dev:cache
   npm run dev:balance
   npm run dev:telegram
   npm run dev:ai-gateway
   npm run dev:ai-services
   npm run dev:frontend
   ```

## 🏗️ Структура проекта

```
neurotask-ai-agents/
├── 📁 server/                 # Основной сервер (порт 3001)
├── 📁 database-service/       # Сервис базы данных (порт 3012)
├── 📁 cache-service/          # Redis сервис (порт 3013)
├── 📁 balance-service/        # Сервис баланса (порт 3002)
├── 📁 telegram-bot-service/   # Telegram бот сервис (порт 3003)
├── 📁 ai-gateway-service/     # AI шлюз (порт 3014)
├── 📁 ai-services/            # AI провайдеры (порты 3015+)
│   ├── openai-service/
│   ├── gemini-service/
│   ├── anthropic-service/
│   ├── xai-service/
│   ├── deepseek-service/
│   ├── gigachat-service/
│   └── yandexgpt-service/
├── 📁 src/                    # React фронтенд
├── 📁 docs/                   # Документация
├── 📁 configs/                # Конфигурации
├── 📁 scripts/                # Скрипты
└── 📁 tests/                  # Тесты
```

## 🔄 Процесс разработки

### 1. Создание ветки

```bash
# Обновите основную ветку
git checkout main
git pull origin main

# Создайте новую ветку для вашей задачи
git checkout -b feature/your-feature-name
# или
git checkout -b bugfix/your-bug-description
# или
git checkout -b hotfix/critical-issue
```

### 2. Названия веток

Используйте префиксы для веток:
- `feature/` - новые функции
- `bugfix/` - исправления ошибок
- `hotfix/` - критические исправления
- `refactor/` - рефакторинг кода
- `docs/` - обновление документации
- `test/` - добавление тестов

Примеры:
```
feature/user-authentication
bugfix/login-validation-error
hotfix/security-vulnerability
refactor/database-connection
docs/api-documentation
test/user-service-tests
```

### 3. Коммиты

Используйте conventional commits:

```
type(scope): description

feat(auth): add JWT token validation
fix(api): resolve CORS issue
docs(readme): update installation guide
test(user): add unit tests for User model
refactor(database): optimize query performance
style(ui): fix button alignment
perf(cache): improve Redis connection pooling
```

**Типы коммитов:**
- `feat` - новая функция
- `fix` - исправление ошибки
- `docs` - документация
- `style` - форматирование кода
- `refactor` - рефакторинг
- `test` - тесты
- `chore` - задачи по сборке
- `perf` - улучшение производительности

### 4. Рабочий процесс

1. **Создайте Issue** для описания задачи
2. **Создайте ветку** от `main`
3. **Разработайте** функциональность
4. **Напишите тесты** для нового кода
5. **Запустите линтер** и тесты
6. **Создайте Pull Request**
7. **Получите код-ревью**
8. **Внесите правки** если необходимо
9. **Получите одобрение** и слейте

## 📝 Стандарты кода

### JavaScript/Node.js

#### ESLint конфигурация
```javascript
// .eslintrc.js
module.exports = {
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended'
  ],
  rules: {
    'indent': ['error', 2],
    'quotes': ['error', 'single'],
    'semi': ['error', 'always'],
    'no-unused-vars': 'warn',
    'no-console': 'warn'
  }
};
```

#### Именование
```javascript
// Переменные и функции - camelCase
const userName = 'John';
const getUserById = (id) => { /* ... */ };

// Константы - UPPER_SNAKE_CASE
const MAX_RETRY_ATTEMPTS = 3;
const API_BASE_URL = 'https://api.example.com';

// Классы - PascalCase
class UserService { /* ... */ }

// Файлы - kebab-case
user-service.js
telegram-bot-manager.js
```

#### Структура файлов
```javascript
// 1. Импорты
const express = require('express');
const { User } = require('../models');

// 2. Константы
const ROUTES = {
  USERS: '/users',
  AUTH: '/auth'
};

// 3. Middleware
const router = express.Router();

// 4. Валидация
const validateUser = (req, res, next) => { /* ... */ };

// 5. Маршруты
router.get(ROUTES.USERS, async (req, res) => { /* ... */ });

// 6. Экспорт
module.exports = router;
```

### React/JSX

#### Компоненты
```jsx
// Функциональные компоненты с хуками
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const UserProfile = ({ userId, onUpdate }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUser(userId);
  }, [userId]);

  const fetchUser = async (id) => {
    try {
      setLoading(true);
      const response = await api.getUser(id);
      setUser(response.data);
    } catch (error) {
      console.error('Error fetching user:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>User not found</div>;

  return (
    <div className="user-profile">
      <h2>{user.name}</h2>
      <p>{user.email}</p>
      <button onClick={() => onUpdate(user)}>
        Update Profile
      </button>
    </div>
  );
};

UserProfile.propTypes = {
  userId: PropTypes.string.isRequired,
  onUpdate: PropTypes.func.isRequired
};

export default UserProfile;
```

#### Стили
```jsx
// Используйте Tailwind CSS классы
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-md">
  <h1 className="text-2xl font-bold text-gray-900">
    Dashboard
  </h1>
  <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
    Add New
  </button>
</div>
```

### База данных

#### Mongoose схемы
```javascript
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: true,
    minlength: 8
  },
  firstName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'moderator'],
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Индексы
userSchema.index({ email: 1 });
userSchema.index({ role: 1, isActive: 1 });

// Виртуальные поля
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Middleware
userSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 12);
  }
  next();
});

// Методы
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Статические методы
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

module.exports = mongoose.model('User', userSchema);
```

## 🧪 Тестирование

### Jest конфигурация
```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/**/*.spec.js'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js']
};
```

### Структура тестов
```javascript
// tests/models/User.test.js
const mongoose = require('mongoose');
const { User } = require('../../src/models/User');

describe('User Model', () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_TEST_URI);
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await User.deleteMany({});
  });

  describe('Validation', () => {
    it('should create a valid user', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe'
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser._id).toBeDefined();
      expect(savedUser.email).toBe(userData.email);
      expect(savedUser.firstName).toBe(userData.firstName);
      expect(savedUser.lastName).toBe(userData.lastName);
    });

    it('should require email field', async () => {
      const userData = {
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe'
      };

      const user = new User(userData);
      let error;

      try {
        await user.save();
      } catch (e) {
        error = e;
      }

      expect(error).toBeDefined();
      expect(error.errors.email).toBeDefined();
    });
  });

  describe('Methods', () => {
    it('should compare password correctly', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe'
      };

      const user = new User(userData);
      await user.save();

      const isMatch = await user.comparePassword('password123');
      expect(isMatch).toBe(true);

      const isNotMatch = await user.comparePassword('wrongpassword');
      expect(isNotMatch).toBe(false);
    });
  });
});
```

### API тесты
```javascript
// tests/api/auth.test.js
const request = require('supertest');
const app = require('../../src/app');
const { User } = require('../../src/models/User');

describe('Auth API', () => {
  beforeEach(async () => {
    await User.deleteMany({});
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.user.firstName).toBe(userData.firstName);
      expect(response.body.user.lastName).toBe(userData.lastName);
      expect(response.body.user.password).toBeUndefined();
    });

    it('should return error for duplicate email', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe'
      };

      // Создаем первого пользователя
      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // Пытаемся создать второго с тем же email
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Email already exists');
    });
  });
});
```

## 📤 Отправка изменений

### 1. Проверка кода

```bash
# Запуск линтера
npm run lint

# Запуск тестов
npm test

# Проверка покрытия
npm run test:coverage

# Проверка типов (если используется TypeScript)
npm run type-check
```

### 2. Подготовка коммита

```bash
# Добавление файлов
git add .

# Проверка статуса
git status

# Создание коммита
git commit -m "feat(auth): add JWT token validation

- Add JWT token generation on login
- Implement token verification middleware
- Add token refresh endpoint
- Update authentication tests

Closes #123"
```

### 3. Отправка в репозиторий

```bash
# Отправка ветки
git push origin feature/your-feature-name

# Если ветка уже существует
git push
```

## 🐛 Создание Issues

### Шаблон для Bug Report
```markdown
## Описание ошибки
Краткое описание проблемы

## Шаги для воспроизведения
1. Перейти к '...'
2. Нажать на '....'
3. Прокрутить до '....'
4. Увидеть ошибку

## Ожидаемое поведение
Что должно происходить

## Фактическое поведение
Что происходит на самом деле

## Скриншоты
Если применимо, добавьте скриншоты

## Окружение
- OS: [например, Windows 10]
- Browser: [например, Chrome 91]
- Version: [например, 1.0.0]

## Дополнительная информация
Любая дополнительная информация
```

### Шаблон для Feature Request
```markdown
## Описание функции
Краткое описание новой функции

## Проблема
Опишите проблему, которую решает эта функция

## Предлагаемое решение
Опишите, как должна работать функция

## Альтернативы
Опишите альтернативные решения

## Дополнительная информация
Любая дополнительная информация
```

## 🔀 Создание Pull Requests

### Шаблон для Pull Request
```markdown
## Описание
Краткое описание изменений

## Тип изменений
- [ ] Bug fix (не ломает существующую функциональность)
- [ ] New feature (добавляет функциональность)
- [ ] Breaking change (ломает существующую функциональность)
- [ ] Documentation update

## Что изменено
- Описание изменений
- Добавленные файлы
- Измененные файлы
- Удаленные файлы

## Тестирование
- [ ] Добавлены тесты для новой функциональности
- [ ] Все тесты проходят
- [ ] Проверено вручную

## Скриншоты
Если применимо, добавьте скриншоты

## Checklist
- [ ] Код соответствует стандартам проекта
- [ ] Документация обновлена
- [ ] Изменения протестированы
- [ ] Все тесты проходят
- [ ] Код прошел code review

## Связанные Issues
Closes #123
Fixes #456
```

### Code Review

#### Что проверять
- **Функциональность** - код работает как ожидается
- **Качество кода** - читаемость, структура, именование
- **Безопасность** - нет уязвимостей
- **Производительность** - эффективность алгоритмов
- **Тестирование** - покрытие тестами
- **Документация** - обновлена при необходимости

#### Комментарии в review
```markdown
👍 Отличная работа!

💡 Предложение:
Можно упростить эту логику, используя Array.reduce()

❓ Вопрос:
Почему используется setTimeout вместо setInterval?

🐛 Проблема:
Здесь может быть race condition при одновременных запросах

🔒 Безопасность:
Нужно добавить валидацию входных данных
```

## 💬 Коммуникация

### Каналы связи
- **GitLab Issues** - для обсуждения задач
- **GitLab Merge Requests** - для code review
- **Slack/Discord** - для быстрого общения
- **Email** - для официальных вопросов

### Правила общения
- Будьте вежливы и уважительны
- Используйте понятный язык
- Приводите примеры и скриншоты
- Отвечайте на комментарии своевременно
- Благодарите за помощь и feedback

### Рабочие встречи
- **Daily Standup** - ежедневно в 9:00
- **Sprint Planning** - каждые 2 недели
- **Retrospective** - в конце каждого спринта
- **Code Review Sessions** - по необходимости

## 🎯 Цели проекта

### Краткосрочные (1-2 месяца)
- Улучшение стабильности системы
- Добавление недостающих тестов
- Оптимизация производительности
- Обновление документации

### Среднесрочные (3-6 месяцев)
- Добавление новых AI провайдеров
- Улучшение UI/UX
- Расширение функциональности ботов
- Интеграция с новыми сервисами

### Долгосрочные (6+ месяцев)
- Масштабирование системы
- Добавление аналитики
- Машинное обучение для улучшения ответов
- Мобильное приложение

## 🏆 Признание вклада

### Contributors
Все участники проекта будут добавлены в:
- README.md файл
- GitLab Contributors
- Release notes

### Особые достижения
- **Bug Hunter** - за найденные критические ошибки
- **Feature Master** - за реализацию сложных функций
- **Documentation Hero** - за улучшение документации
- **Testing Champion** - за высокое покрытие тестами

## 📚 Полезные ресурсы

### Документация
- [Node.js Documentation](https://nodejs.org/docs/)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [MongoDB Manual](https://docs.mongodb.com/manual/)
- [React Documentation](https://reactjs.org/docs/getting-started.html)
- [Jest Testing Framework](https://jestjs.io/docs/getting-started)

### Инструменты
- [ESLint](https://eslint.org/docs/user-guide/)
- [Prettier](https://prettier.io/docs/en/)
- [Husky](https://typicode.github.io/husky/)
- [Commitizen](https://commitizen.github.io/cz-cli/)

### Сообщество
- [Stack Overflow](https://stackoverflow.com/)
- [Node.js Community](https://nodejs.org/en/get-involved/)
- [React Community](https://reactjs.org/community/support.html)

## 🤝 Получение помощи

### Когда обращаться за помощью
- Застряли на задаче более 2 часов
- Не понимаете требования
- Нашли баг, который не можете исправить
- Нужна помощь с архитектурными решениями

### Как обращаться за помощью
1. **Попробуйте решить самостоятельно** сначала
2. **Изучите документацию** и существующий код
3. **Создайте Issue** с детальным описанием
4. **Обратитесь к команде** в Slack/Discord
5. **Запланируйте встречу** для сложных вопросов

### Кто может помочь
- **Team Lead** - архитектурные вопросы
- **Senior Developers** - сложные технические проблемы
- **Product Owner** - требования и бизнес-логика
- **QA Team** - тестирование и качество

---

**Спасибо за ваш вклад в проект! 🎉**

Если у вас есть вопросы или предложения по улучшению этого руководства, создайте Issue или свяжитесь с командой разработки.
