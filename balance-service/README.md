# Balance Service

Микросервис для управления балансом токенов пользователей.

## Возможности

- ✅ Получение баланса пользователя
- ✅ Списание токенов (атомарные операции)
- ✅ Пополнение токенов
- ✅ История транзакций
- ✅ Статистика использования
- ✅ Бонусные токены
- ✅ Возврат токенов
- ✅ API ключ аутентификация
- ✅ Rate limiting
- ✅ CORS поддержка
- ✅ Логирование

## Установка

```bash
cd balance-service
npm install
```

## Конфигурация

Скопируйте `env.example` в `.env` и настройте переменные:

```bash
cp env.example .env
```

### Переменные окружения

- `MONGODB_URI` - URI подключения к MongoDB
- `BALANCE_SERVICE_PORT` - Порт сервиса (по умолчанию 3002)
- `BALANCE_SERVICE_API_KEY` - Секретный API ключ для доступа
- `ALLOWED_ORIGINS` - Разрешенные источники запросов

## Запуск

### Разработка
```bash
npm run dev
```

### Продакшн
```bash
npm start
```

## API Endpoints

### Аутентификация

Все запросы требуют API ключ в заголовке:
```
X-API-Key: your-secret-api-key
```

### Получить баланс пользователя
```
GET /api/balance/:userId
```

### Списать токены
```
POST /api/balance/:userId/deduct
Content-Type: application/json

{
  "amount": 1,
  "description": "Использование AI",
  "metadata": {
    "provider": "openai",
    "source": "telegram_bot"
  }
}
```

### Пополнить токены
```
POST /api/balance/:userId/add
Content-Type: application/json

{
  "amount": 10,
  "description": "Пополнение баланса",
  "metadata": {
    "payment_method": "card"
  }
}
```

### Получить историю транзакций
```
GET /api/balance/:userId/transactions?page=1&limit=20&type=spend
```

### Получить статистику
```
GET /api/balance/:userId/stats?period=30d
```

### Проверить статус сервиса
```
GET /api/health
```

## Примеры использования

### JavaScript/Node.js

```javascript
const axios = require('axios');

const balanceService = axios.create({
  baseURL: 'http://localhost:3002/api',
  headers: {
    'X-API-Key': 'your-secret-api-key'
  }
});

// Получить баланс
const balance = await balanceService.get('/balance/user-id');

// Списать токены
const deduction = await balanceService.post('/balance/user-id/deduct', {
  amount: 1,
  description: 'Использование AI',
  metadata: { provider: 'openai' }
});

// Пополнить токены
const topUp = await balanceService.post('/balance/user-id/add', {
  amount: 10,
  description: 'Пополнение',
  metadata: { payment_method: 'card' }
});
```

### cURL

```bash
# Получить баланс
curl -H "X-API-Key: your-secret-api-key" \
  http://localhost:3002/api/balance/user-id

# Списать токены
curl -X POST \
  -H "X-API-Key: your-secret-api-key" \
  -H "Content-Type: application/json" \
  -d '{"amount": 1, "description": "AI usage"}' \
  http://localhost:3002/api/balance/user-id/deduct
```

## Интеграция с основным приложением

Для интеграции с основным приложением создайте клиент:

```javascript
// services/balanceClient.js
const axios = require('axios');

class BalanceClient {
  constructor(baseURL, apiKey) {
    this.client = axios.create({
      baseURL: `${baseURL}/api`,
      headers: {
        'X-API-Key': apiKey
      }
    });
  }

  async getBalance(userId) {
    const response = await this.client.get(`/balance/${userId}`);
    return response.data;
  }

  async deductTokens(userId, amount, description, metadata = {}) {
    const response = await this.client.post(`/balance/${userId}/deduct`, {
      amount,
      description,
      metadata
    });
    return response.data;
  }

  async addTokens(userId, amount, description, metadata = {}) {
    const response = await this.client.post(`/balance/${userId}/add`, {
      amount,
      description,
      metadata
    });
    return response.data;
  }
}

module.exports = BalanceClient;
```

## Мониторинг

Сервис предоставляет endpoint для проверки здоровья:

```bash
curl http://localhost:3002/api/health
```

Ответ:
```json
{
  "success": true,
  "service": "Balance Service",
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 3600
}
```

## Безопасность

- API ключ аутентификация
- Rate limiting (100 запросов за 15 минут)
- CORS защита
- Валидация входных данных
- Атомарные операции с базой данных

## Логирование

Сервис использует Morgan для логирования HTTP запросов. Логи включают:
- IP адрес
- Метод запроса
- URL
- Статус ответа
- Время выполнения
- Размер ответа

## Разработка

### Структура проекта

```
balance-service/
├── models/
│   ├── User.js
│   └── TokenTransaction.js
├── services/
│   └── balanceService.js
├── server.js
├── package.json
├── env.example
└── README.md
```

### Тестирование

```bash
npm test
```

## Лицензия

MIT 