# 🗄️ MongoDB Server для Telegram Calendar App

## 📋 Описание

Полноценный сервер с MongoDB для управления пользователями, токенами и AI настройками.

## 🏗️ Структура базы данных

### 📊 Коллекции MongoDB:

#### 1. **`users`** - Пользователи
```javascript
{
  _id: ObjectId("..."),
  username: "testuser",
  email: "test@example.com",
  password: "hashed_password",
  balance: 1000,
  isActive: true,
  lastLogin: ISODate("2024-01-01T00:00:00Z"),
  createdAt: ISODate("2024-01-01T00:00:00Z"),
  updatedAt: ISODate("2024-01-01T00:00:00Z")
}
```

#### 2. **`token_transactions`** - История транзакций токенов
```javascript
{
  _id: ObjectId("..."),
  userId: ObjectId("..."),
  type: "top_up" | "spend" | "refund" | "bonus",
  amount: 100,
  balanceAfter: 1100,
  description: "Пополнение баланса",
  metadata: {
    provider: "openai",
    model: "gpt-4",
    tokensUsed: 150,
    requestId: "req_123"
  },
  status: "completed" | "pending" | "failed" | "cancelled",
  createdAt: ISODate("2024-01-01T00:00:00Z"),
  updatedAt: ISODate("2024-01-01T00:00:00Z")
}
```

#### 3. **`ai_settings`** - AI настройки (с шифрованием)
```javascript
{
  _id: ObjectId("..."),
  userId: ObjectId("..."),
  apiKeys: {
    openai: "encrypted_sk-...",
    gemini: "encrypted_AIza...",
    xai: "encrypted_xai-...",
    // ... остальные провайдеры
  },
  activeProviders: ["openai", "gemini"],
  defaultProvider: "openai",
  settings: {
    maxTokens: 4000,
    temperature: 0.7,
    autoSave: true
  },
  createdAt: ISODate("2024-01-01T00:00:00Z"),
  updatedAt: ISODate("2024-01-01T00:00:00Z")
}
```

## 🔐 Безопасность

### ✅ Шифрование API ключей
- Все API ключи шифруются перед сохранением в MongoDB
- Используется AES-256-CBC шифрование
- Ключ шифрования хранится в переменной окружения `ENCRYPTION_KEY`

### ✅ Хеширование паролей
- Пароли хешируются с помощью bcrypt
- Соль генерируется автоматически
- 10 раундов хеширования

### ✅ Валидация данных
- Mongoose схемы с валидацией
- Проверка email формата
- Ограничения на длину полей

## 🚀 Установка и запуск

### 1. Установка зависимостей
```bash
npm install
```

### 2. Настройка MongoDB
```bash
# Установите MongoDB локально или используйте MongoDB Atlas
# Локальная установка:
# 1. Скачайте MongoDB с официального сайта
# 2. Запустите MongoDB сервис
# 3. Создайте базу данных: telegram_calendar_app
```

### 3. Настройка переменных окружения
```bash
# Скопируйте server.env в .env
cp server.env .env

# Отредактируйте .env файл:
# - MONGODB_URI - URI для подключения к MongoDB
# - SESSION_SECRET - секретный ключ для сессий
# - ENCRYPTION_KEY - ключ для шифрования API ключей
```

### 4. Запуск сервера
```bash
# Разработка
npm run dev

# Продакшн
npm start
```

## 📡 API Endpoints

### 🔐 Аутентификация
- `POST /api/auth/register` - Регистрация
- `POST /api/auth/login` - Вход
- `POST /api/auth/logout` - Выход
- `GET /api/auth/me` - Получение данных пользователя
- `PUT /api/auth/profile` - Обновление профиля
- `PUT /api/auth/password` - Смена пароля

### 💰 Управление токенами
- `GET /api/tokens/balance` - Получение баланса
- `GET /api/tokens/history` - История транзакций
- `POST /api/tokens/top-up` - Пополнение баланса
- `POST /api/tokens/spend` - Списание токенов
- `GET /api/tokens/stats` - Статистика токенов

### 🤖 AI Настройки
- `GET /api/ai-settings` - Получение настроек
- `POST /api/ai-settings` - Сохранение настроек
- `POST /api/ai-settings/test` - Тестирование API ключей

## 🔍 Примеры запросов

### Регистрация пользователя
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Пополнение токенов
```bash
curl -X POST http://localhost:3001/api/tokens/top-up \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=..." \
  -d '{
    "amount": 500
  }'
```

### Сохранение AI настроек
```bash
curl -X POST http://localhost:3001/api/ai-settings \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=..." \
  -d '{
    "apiKeys": {
      "openai": "sk-...",
      "gemini": "AIza..."
    },
    "activeProviders": ["openai", "gemini"],
    "defaultProvider": "openai"
  }'
```

## 📊 Индексы MongoDB

### Оптимизация запросов:
```javascript
// users collection
db.users.createIndex({ "email": 1 }, { unique: true })

// token_transactions collection
db.token_transactions.createIndex({ "userId": 1, "createdAt": -1 })
db.token_transactions.createIndex({ "type": 1, "createdAt": -1 })
db.token_transactions.createIndex({ "status": 1 })

// ai_settings collection
db.ai_settings.createIndex({ "userId": 1 }, { unique: true })
```

## 🛠️ Разработка

### Структура проекта:
```
├── models/
│   ├── User.js              # Модель пользователя
│   ├── TokenTransaction.js  # Модель транзакций
│   └── AISettings.js        # Модель AI настроек
├── server.js                # Основной сервер
├── package.json             # Зависимости
├── server.env              # Переменные окружения
└── README_MONGODB.md       # Документация
```

### Добавление новых провайдеров AI:
1. Обновите схему в `models/AISettings.js`
2. Добавьте валидацию в `server.js`
3. Обновите тестирование API ключей

## 🔧 Миграции

### Создание пользователя по умолчанию:
```javascript
// В MongoDB shell:
use telegram_calendar_app

db.users.insertOne({
  username: "admin",
  email: "admin@example.com",
  password: "$2a$10$...", // bcrypt hash
  balance: 1000,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
})
```

## 🚨 Важные замечания

1. **Безопасность**: Измените секретные ключи в продакшене
2. **MongoDB**: Убедитесь, что MongoDB запущен
3. **Переменные окружения**: Не коммитьте .env файл
4. **Шифрование**: Ключ шифрования должен быть достаточно длинным
5. **Индексы**: Создайте индексы для оптимизации запросов

## 📞 Поддержка

При возникновении проблем:
1. Проверьте подключение к MongoDB
2. Убедитесь, что все переменные окружения настроены
3. Проверьте логи сервера
4. Убедитесь, что порт 3001 свободен 