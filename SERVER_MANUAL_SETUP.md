# 🖥️ Ручная настройка сервера

## Обзор

Простая инструкция для ручного запуска Telegram Calendar App на сервере.

## 📋 Требования к серверу

### Минимальные требования:
- Ubuntu 20.04+ или Debian 11+
- 1GB RAM минимум
- 5GB свободного места
- SSH доступ

## 🚀 Пошаговая настройка

### 1. Подключение к серверу

```bash
# Подключение по SSH
ssh root@89.169.172.35
```

### 2. Обновление системы

```bash
# Обновление пакетов
apt update && apt upgrade -y

# Установка необходимых пакетов
apt install -y curl wget git nginx ufw
```

### 3. Установка Node.js

```bash
# Установка Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Проверка установки
node --version
npm --version
```

### 4. Установка PM2

```bash
# Глобальная установка PM2
npm install -g pm2

# Настройка автозапуска
pm2 startup
# Следуйте инструкциям в выводе команды
```

### 5. Создание пользователя для приложения

```bash
# Создание пользователя
adduser --disabled-password --gecos '' appuser
usermod -aG sudo appuser

# Создание директории для приложения
mkdir -p /var/www/telegram-calendar
chown -R appuser:appuser /var/www/telegram-calendar
```

### 6. Копирование файлов на сервер

#### Вариант 1: Через SCP (с локальной машины)

```bash
# Сборка фронтенда локально
npm run build

# Копирование файлов на сервер
scp -r ./ root@89.169.172.35:/var/www/telegram-calendar/
scp -r ./dist root@89.169.172.35:/var/www/telegram-calendar/

# Копирование переменных окружения
scp .env.production root@89.169.172.35:/var/www/telegram-calendar/.env
```

#### Вариант 2: Через Git (на сервере)

```bash
# Переключение на пользователя приложения
su - appuser

# Клонирование репозитория
cd /var/www/telegram-calendar
git clone https://github.com/your-username/telegram-calendar-app.git .

# Установка зависимостей
npm install
cd server && npm install
cd ..

# Сборка фронтенда
npm run build
```

### 7. Настройка переменных окружения

```bash
# Создание файла .env
nano /var/www/telegram-calendar/.env
```

Содержимое `.env`:

```env
# Production Environment
NODE_ENV=production
PORT=3001

# MongoDB (используйте MongoDB Atlas или установите локально)
MONGODB_URI=mongodb://username:password@host:port/database

# Session
SESSION_SECRET=your-super-secret-production-key

# Email
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=noreply@yourdomain.com
```

### 8. Установка зависимостей на сервере

```bash
# Переключение на пользователя приложения
su - appuser

# Установка зависимостей
cd /var/www/telegram-calendar
npm ci --only=production
cd server && npm ci --only=production
cd ..
```

### 9. Запуск приложения

```bash
# Переключение на пользователя приложения
su - appuser

# Запуск через PM2
cd /var/www/telegram-calendar
pm2 start server/server.js --name telegram-calendar

# Сохранение конфигурации PM2
pm2 save
```

### 10. Настройка Nginx

```bash
# Создание конфигурации Nginx
nano /etc/nginx/sites-available/telegram-calendar
```

Содержимое конфигурации:

```nginx
server {
    listen 80;
    server_name 89.169.172.35;

    # Статические файлы фронтенда
    location / {
        root /var/www/telegram-calendar/dist;
        try_files $uri $uri/ /index.html;
        
        # Кэширование
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # API проксирование
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Health check
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
```

```bash
# Активация сайта
ln -sf /etc/nginx/sites-available/telegram-calendar /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Проверка конфигурации
nginx -t

# Перезагрузка Nginx
systemctl reload nginx
```

### 11. Настройка firewall

```bash
# Открытие портов
ufw allow 22/tcp    # SSH
ufw allow 80/tcp     # HTTP
ufw allow 443/tcp    # HTTPS

# Включение firewall
ufw --force enable
```

## 📊 Управление приложением

### PM2 команды:

```bash
# Статус приложения
pm2 status

# Логи приложения
pm2 logs telegram-calendar

# Перезапуск приложения
pm2 restart telegram-calendar

# Остановка приложения
pm2 stop telegram-calendar

# Удаление приложения
pm2 delete telegram-calendar
```

### Nginx команды:

```bash
# Перезагрузка конфигурации
nginx -t && systemctl reload nginx

# Просмотр логов
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

## 🔍 Проверка работы

### Health checks:

```bash
# Проверка фронтенда
curl http://89.169.172.35/health

# Проверка API
curl http://89.169.172.35/api/ping
```

### Проверка процессов:

```bash
# Проверка PM2
pm2 status

# Проверка Nginx
systemctl status nginx

# Проверка портов
netstat -tlnp | grep :80
netstat -tlnp | grep :3001
```

## 🔧 Troubleshooting

### Частые проблемы:

1. **Приложение не запускается**:
   ```bash
   pm2 logs telegram-calendar
   ```

2. **Порт занят**:
   ```bash
   netstat -tlnp | grep :3001
   pm2 delete telegram-calendar
   pm2 start server/server.js --name telegram-calendar
   ```

3. **Nginx не отвечает**:
   ```bash
   nginx -t
   systemctl status nginx
   ```

4. **Проблемы с правами доступа**:
   ```bash
   chown -R appuser:appuser /var/www/telegram-calendar
   chmod 755 /var/www/telegram-calendar
   ```

## 📝 Обновление приложения

### Процесс обновления:

```bash
# 1. Остановка приложения
pm2 stop telegram-calendar

# 2. Обновление кода (через Git или SCP)
cd /var/www/telegram-calendar
git pull origin main

# 3. Установка новых зависимостей
npm ci --only=production
cd server && npm ci --only=production
cd ..

# 4. Сборка фронтенда
npm run build

# 5. Запуск приложения
pm2 start telegram-calendar
```

## 🛡️ Безопасность

### Рекомендации:

1. **Измените SSH порт** (не 22)
2. **Настройте fail2ban** для защиты от брутфорса
3. **Установите SSL сертификат** (Let's Encrypt)
4. **Регулярно обновляйте систему**
5. **Мониторьте логи**

### Установка SSL:

```bash
# Установка Certbot
apt install certbot python3-certbot-nginx

# Получение SSL сертификата
certbot --nginx -d your-domain.com
```

## 🎯 Готово!

После выполнения всех шагов ваше приложение будет доступно по адресу:
**http://89.169.172.35**

**Статус приложения:**
- ✅ Node.js установлен
- ✅ PM2 настроен
- ✅ Nginx настроен
- ✅ Firewall настроен
- ✅ Приложение запущено
- ✅ Автозапуск настроен

**Готово к использованию!** 🚀 