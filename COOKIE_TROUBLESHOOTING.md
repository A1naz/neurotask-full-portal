# Диагностика проблем с куки

## Проблема
Куки не сохраняются на портале, что приводит к потере аутентификации пользователей.

## Возможные причины и решения

### 1. Проблемы с CORS настройками

**Проблема:** Сервер не разрешает credentials в CORS настройках.

**Решение для сервера (Node.js/Express):**
```javascript
const cors = require('cors');

app.use(cors({
  origin: ['http://localhost:5173', 'https://neurotask.ru'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
```

**Решение для сервера (Python/Flask):**
```python
from flask_cors import CORS

CORS(app, 
     origins=['http://localhost:5173', 'https://neurotask.ru'],
     supports_credentials=True)
```

### 2. Проблемы с настройками куки на сервере

**Проблема:** Куки устанавливаются с неправильными параметрами.

**Решение для сервера (Node.js/Express):**
```javascript
// При установке куки
res.cookie('sessionId', sessionId, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production', // true для HTTPS
  sameSite: 'lax', // или 'strict'
  domain: process.env.NODE_ENV === 'production' ? '.neurotask.ru' : 'localhost',
  path: '/',
  maxAge: 24 * 60 * 60 * 1000 // 24 часа
});
```

### 3. Проблемы с доменами

**Проблема:** Куки устанавливаются для неправильного домена.

**Проверьте:**
- В разработке: `localhost` или `127.0.0.1`
- В продакшене: `neurotask.ru` (без www)

### 4. Проблемы с HTTPS

**Проблема:** В продакшене куки требуют HTTPS.

**Решение:**
- Убедитесь, что сайт работает по HTTPS
- Установите `secure: true` для куки в продакшене

### 5. Проблемы с браузерными настройками

**Проверьте:**
- Включены ли куки в браузере
- Нет ли блокировщиков рекламы
- Настройки приватности браузера

### 6. Проблемы с SameSite

**Проблема:** Современные браузеры требуют правильные настройки SameSite.

**Рекомендуемые настройки:**
```javascript
// Для аутентификации
sameSite: 'lax' // или 'strict' для большей безопасности

// Для кросс-доменных запросов
sameSite: 'none' // требует secure: true
```

## Диагностика

### 1. Используйте компонент CookieDebug
Перейдите в `/assistant/cookie-debug` для диагностики.

### 2. Проверьте консоль браузера
Откройте Developer Tools (F12) и проверьте:
- Network tab для запросов
- Console tab для ошибок
- Application tab для куки

### 3. Проверьте заголовки ответов
Убедитесь, что сервер отправляет правильные заголовки:
```
Set-Cookie: sessionId=abc123; HttpOnly; Secure; SameSite=Lax; Path=/; Domain=neurotask.ru
```

## Тестирование

### 1. Локальное тестирование
```bash
# Запустите сервер разработки
npm run dev

# Проверьте куки в браузере
http://localhost:5173/assistant/cookie-debug
```

### 2. Продакшн тестирование
```bash
# Соберите проект
npm run build

# Проверьте куки в браузере
https://neurotask.ru/assistant/cookie-debug
```

## Рекомендации по безопасности

1. **HttpOnly:** Всегда используйте для сессионных куки
2. **Secure:** Обязательно в продакшене
3. **SameSite:** Используйте 'lax' или 'strict'
4. **Domain:** Указывайте правильный домен
5. **Path:** Указывайте '/'

## Пример правильной настройки сервера

```javascript
// Настройка сессии
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    domain: process.env.NODE_ENV === 'production' ? '.neurotask.ru' : undefined,
    maxAge: 24 * 60 * 60 * 1000 // 24 часа
  }
}));

// CORS настройки
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://neurotask.ru'] 
    : ['http://localhost:5173'],
  credentials: true
}));
``` 