# Настройка Email для подтверждения

## Переменные окружения

Создайте файл `.env` в папке `server/` со следующими переменными:

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/telegram_calendar_app

# Session
SESSION_SECRET=your-secret-key-here

# Email Configuration (для продакшена)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=noreply@telegramcalendar.com

# Server
PORT=3001
NODE_ENV=development
```

## Настройка Gmail для отправки email

### 1. Включение двухфакторной аутентификации
1. Перейдите в настройки Google аккаунта
2. Включите двухфакторную аутентификацию

### 2. Создание пароля приложения
1. Перейдите в "Безопасность" → "Пароли приложений"
2. Создайте новый пароль для приложения
3. Используйте этот пароль в `EMAIL_PASS`

### 3. Альтернативные сервисы
Можно использовать другие email сервисы:
- **SendGrid**: `EMAIL_SERVICE=sendgrid`
- **Mailgun**: `EMAIL_SERVICE=mailgun`
- **Amazon SES**: `EMAIL_SERVICE=ses`

## Режим разработки

В режиме разработки (`NODE_ENV=development`) используется Ethereal Email для тестирования. Email не отправляется реально, но вы можете увидеть preview в консоли сервера.

## Тестирование

1. Запустите сервер: `npm run dev` (в папке server)
2. Зарегистрируйтесь с реальным email
3. Проверьте консоль сервера для получения preview URL
4. Или настройте реальный email сервис для продакшена 