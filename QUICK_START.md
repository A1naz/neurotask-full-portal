# ⚡ Быстрый старт

## 🚀 Локальная разработка

### 1. Установка зависимостей
```bash
npm install
cd server && npm install
```

### 2. Запуск
```bash
# Терминал 1: Фронтенд
npm run dev

# Терминал 2: Бэкенд
cd server && npm start
```

### 3. Открыть в браузере
- Frontend: http://localhost:5173
- Backend: http://localhost:3001

## 🖥️ Деплой на сервер

### 1. Сборка фронтенда
```bash
npm run build
```

### 2. Копирование на сервер
```bash
# Копирование файлов
scp -r ./ root@89.169.172.35:/var/www/telegram-calendar/
scp -r ./dist root@89.169.172.35:/var/www/telegram-calendar/

# Копирование переменных окружения
scp .env.production root@89.169.172.35:/var/www/telegram-calendar/.env
```

### 3. Настройка сервера
См. подробную инструкцию: [SERVER_MANUAL_SETUP.md](SERVER_MANUAL_SETUP.md)

## 📋 Основные команды

```bash
npm run dev          # Запуск фронтенда
npm run build        # Сборка фронтенда
npm run lint         # Проверка кода
```

## 🔧 Настройка

1. **Переменные окружения**: Скопируйте `env.example` в `.env`
2. **Email**: Настройте в `EMAIL_SETUP.md`
3. **MongoDB**: Настройте в `README_MONGODB.md`

## 🎯 Готово!

После настройки приложение будет доступно по адресу:
**http://89.169.172.35** 