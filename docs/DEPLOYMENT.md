# 🚀 Руководство по развертыванию

## Обзор

Это руководство описывает процесс развертывания Neurotask - AI Agents for Business в различных средах.

## 🏗️ Требования к системе

### Минимальные требования
- **CPU**: 4 ядра
- **RAM**: 8 GB
- **Storage**: 50 GB SSD
- **OS**: Ubuntu 20.04+ / CentOS 8+ / Windows Server 2019+

### Рекомендуемые требования
- **CPU**: 8+ ядер
- **RAM**: 16+ GB
- **Storage**: 100+ GB SSD
- **OS**: Ubuntu 22.04 LTS

### Программное обеспечение
- **Node.js**: 18.x LTS
- **MongoDB**: 6.0+
- **Redis**: 6.2+
- **Docker**: 20.10+
- **Docker Compose**: 2.0+
- **Nginx**: 1.18+

## 🔧 Подготовка окружения

### 1. Установка Node.js
```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# CentOS/RHEL
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Windows
# Скачать с https://nodejs.org/
```

### 2. Установка MongoDB
```bash
# Ubuntu/Debian
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod

# CentOS/RHEL
cat <<EOF | sudo tee /etc/yum.repos.d/mongodb-org-6.0.repo
[mongodb-org-6.0]
name=MongoDB Repository
baseurl=https://repo.mongodb.org/yum/redhat/\$releasever/mongodb-org/6.0/x86_64/
gpgcheck=1
enabled=1
gpgkey=https://www.mongodb.org/static/pgp/server-6.0.asc
EOF
sudo yum install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod
```

### 3. Установка Redis
```bash
# Ubuntu/Debian
sudo apt-get install -y redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server

# CentOS/RHEL
sudo yum install -y redis
sudo systemctl start redis
sudo systemctl enable redis
```

### 4. Установка Docker
```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# CentOS/RHEL
sudo yum install -y yum-utils
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
sudo yum install -y docker-ce docker-ce-cli containerd.io
sudo systemctl start docker
sudo systemctl enable docker
```

## 📁 Структура проекта

```
neurotask-ai-agents/
├── server/                 # Основной сервер
├── database-service/       # Сервис базы данных
├── cache-service/          # Redis сервис
├── balance-service/        # Сервис баланса
├── telegram-bot-service/   # Telegram бот сервис
├── ai-gateway-service/     # AI шлюз
├── ai-services/            # AI провайдеры
├── frontend/               # React приложение
├── docker/                 # Docker конфигурации
├── configs/                # Конфигурации окружений
└── scripts/                # Скрипты развертывания
```

## 🔐 Конфигурация

### 1. Создание .env файлов

#### configs/development.env
```bash
# Основные настройки
NODE_ENV=development
PORT=3001

# База данных
MONGODB_URI=mongodb://localhost:27017/neurotask_dev
MONGODB_MAX_POOL_SIZE=10
MONGODB_MIN_POOL_SIZE=2

# Redis
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=

# Сессии
SESSION_SECRET=your-development-secret-key
SESSION_MAX_AGE=86400000

# API ключи
DATABASE_SERVICE_API_KEY=database-service-dev-key
CACHE_SERVICE_API_KEY=cache-service-dev-key
BALANCE_SERVICE_API_KEY=balance-service-dev-key

# AI провайдеры
OPENAI_API_KEY=your-openai-key
GEMINI_API_KEY=your-gemini-key
ANTHROPIC_API_KEY=your-anthropic-key

# Telegram
TELEGRAM_BOT_TOKEN=your-telegram-bot-token

# Google Calendar
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

#### configs/production.env
```bash
# Основные настройки
NODE_ENV=production
PORT=3001

# База данных
MONGODB_URI=mongodb://username:password@mongodb-host:27017/neurotask_prod
MONGODB_MAX_POOL_SIZE=50
MONGODB_MIN_POOL_SIZE=10

# Redis
REDIS_URL=redis://username:password@redis-host:6379
REDIS_PASSWORD=your-redis-password

# Сессии
SESSION_SECRET=your-production-secret-key-very-long-and-secure
SESSION_MAX_AGE=86400000

# API ключи
DATABASE_SERVICE_API_KEY=database-service-prod-key-very-secure
CACHE_SERVICE_API_KEY=cache-service-prod-key-very-secure
BALANCE_SERVICE_API_KEY=balance-service-prod-key-very-secure

# AI провайдеры
OPENAI_API_KEY=your-openai-production-key
GEMINI_API_KEY=your-gemini-production-key
ANTHROPIC_API_KEY=your-anthropic-production-key

# Telegram
TELEGRAM_BOT_TOKEN=your-telegram-bot-production-token

# Google Calendar
GOOGLE_CLIENT_ID=your-google-production-client-id
GOOGLE_CLIENT_SECRET=your-google-production-client-secret

# Безопасность
CORS_ORIGIN=https://your-domain.com
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=1000
```

### 2. Настройка MongoDB

#### Создание пользователя
```javascript
use neurotask
db.createUser({
  user: "neurotask_user",
  pwd: "secure_password",
  roles: [
    { role: "readWrite", db: "neurotask" },
    { role: "dbAdmin", db: "neurotask" }
  ]
})
```

#### Настройка аутентификации
```bash
# /etc/mongod.conf
security:
  authorization: enabled
```

### 3. Настройка Redis

#### /etc/redis/redis.conf
```bash
# Безопасность
requirepass your_redis_password

# Производительность
maxmemory 2gb
maxmemory-policy allkeys-lru

# Персистентность
save 900 1
save 300 10
save 60 10000
```

## 🐳 Docker развертывание

### 1. Создание docker-compose.yml

```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:6.0
    container_name: neurotask_mongodb
    restart: unless-stopped
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: secure_password
      MONGO_INITDB_DATABASE: neurotask
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
      - ./scripts/mongo-init.js:/docker-entrypoint-initdb.d/mongo-init.js:ro

  redis:
    image: redis:6.2-alpine
    container_name: neurotask_redis
    restart: unless-stopped
    command: redis-server --requirepass your_redis_password
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  database-service:
    build: ./database-service
    container_name: neurotask_database
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://admin:secure_password@mongodb:27017/neurotask
      - REDIS_URL=redis://:your_redis_password@redis:6379
    ports:
      - "3012:3012"
    depends_on:
      - mongodb
      - redis

  cache-service:
    build: ./cache-service
    container_name: neurotask_cache
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - REDIS_URL=redis://:your_redis_password@redis:6379
    ports:
      - "3013:3013"
    depends_on:
      - redis

  balance-service:
    build: ./balance-service
    container_name: neurotask_balance
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://admin:secure_password@mongodb:27017/neurotask
    ports:
      - "3002:3002"
    depends_on:
      - mongodb

  main-server:
    build: ./server
    container_name: neurotask_main
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://admin:secure_password@mongodb:27017/neurotask
      - REDIS_URL=redis://:your_redis_password@redis:6379
    ports:
      - "3001:3001"
    depends_on:
      - mongodb
      - redis
      - database-service
      - cache-service
      - balance-service

  frontend:
    build: ./frontend
    container_name: neurotask_frontend
    restart: unless-stopped
    ports:
      - "80:80"
    depends_on:
      - main-server

volumes:
  mongodb_data:
  redis_data:
```

### 2. Запуск с Docker Compose

```bash
# Сборка и запуск
docker-compose up -d --build

# Просмотр логов
docker-compose logs -f

# Остановка
docker-compose down

# Остановка с удалением volumes
docker-compose down -v
```

## 🚀 Ручное развертывание

### 1. Установка зависимостей

```bash
# Корневой проект
npm ci

# Основной сервер
cd server
npm ci

# Сервисы
cd ../database-service && npm ci
cd ../cache-service && npm ci
cd ../balance-service && npm ci
cd ../telegram-bot-service && npm ci
cd ../ai-gateway-service && npm ci

# AI сервисы
cd ../openai-service && npm ci
cd ../gemini-service && npm ci
cd ../anthropic-service && npm ci
cd ../xai-service && npm ci
cd ../deepseek-service && npm ci
cd ../gigachat-service && npm ci
cd ../yandexgpt-service && npm ci

# Фронтенд
cd ../frontend && npm ci
```

### 2. Запуск сервисов

```bash
# Запуск в фоне
nohup npm start > server.log 2>&1 &
nohup cd database-service && npm start > database.log 2>&1 &
nohup cd cache-service && npm start > cache.log 2>&1 &
nohup cd balance-service && npm start > balance.log 2>&1 &
nohup cd telegram-bot-service && npm start > telegram.log 2>&1 &
nohup cd ai-gateway-service && npm start > ai-gateway.log 2>&1 &

# AI сервисы
nohup cd openai-service && npm start > openai.log 2>&1 &
nohup cd gemini-service && npm start > gemini.log 2>&1 &
nohup cd anthropic-service && npm start > anthropic.log 2>&1 &
nohup cd xai-service && npm start > xai.log 2>&1 &
nohup cd deepseek-service && npm start > deepseek.log 2>&1 &
nohup cd gigachat-service && npm start > gigachat.log 2>&1 &
nohup cd yandexgpt-service && npm start > yandexgpt.log 2>&1 &

# Фронтенд
nohup cd frontend && npm run build && npm start > frontend.log 2>&1 &
```

### 3. Использование PM2

```bash
# Установка PM2
npm install -g pm2

# Запуск сервисов
pm2 start server/ecosystem.config.js
pm2 start database-service/ecosystem.config.js
pm2 start cache-service/ecosystem.config.js
pm2 start balance-service/ecosystem.config.js
pm2 start telegram-bot-service/ecosystem.config.js
pm2 start ai-gateway-service/ecosystem.config.js

# AI сервисы
pm2 start openai-service/ecosystem.config.js
pm2 start gemini-service/ecosystem.config.js
pm2 start anthropic-service/ecosystem.config.js
pm2 start xai-service/ecosystem.config.js
pm2 start deepseek-service/ecosystem.config.js
pm2 start gigachat-service/ecosystem.config.js
pm2 start yandexgpt-service/ecosystem.config.js

# Мониторинг
pm2 monit
pm2 logs
pm2 status
```

## 🔒 Настройка безопасности

### 1. Firewall

```bash
# Ubuntu/Debian
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3001/tcp
sudo ufw allow 3012/tcp
sudo ufw allow 3013/tcp
sudo ufw allow 3002/tcp

# CentOS/RHEL
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --permanent --add-port=3001/tcp
sudo firewall-cmd --permanent --add-port=3012/tcp
sudo firewall-cmd --permanent --add-port=3013/tcp
sudo firewall-cmd --permanent --add-port=3002/tcp
sudo firewall-cmd --reload
```

### 2. SSL/TLS сертификаты

```bash
# Установка Certbot
sudo apt-get install certbot python3-certbot-nginx

# Получение сертификата
sudo certbot --nginx -d your-domain.com

# Автообновление
sudo crontab -e
# Добавить: 0 12 * * * /usr/bin/certbot renew --quiet
```

### 3. Nginx конфигурация

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # Frontend
    location / {
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

    # API
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 📊 Мониторинг и логирование

### 1. Логирование

```bash
# Централизованный сбор логов
sudo apt-get install rsyslog

# Конфигурация rsyslog
# /etc/rsyslog.conf
*.* @@log-server:514
```

### 2. Мониторинг

```bash
# Установка Prometheus
wget https://github.com/prometheus/prometheus/releases/download/v2.45.0/prometheus-2.45.0.linux-amd64.tar.gz
tar xvf prometheus-*.tar.gz
cd prometheus-*

# Конфигурация
cat > prometheus.yml << EOF
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'neurotask-ai-agents'
    static_configs:
      - targets: ['localhost:3001', 'localhost:3012', 'localhost:3013']
EOF

# Запуск
./prometheus --config.file=prometheus.yml
```

## 🔄 Обновление

### 1. Остановка сервисов

```bash
# Docker
docker-compose down

# PM2
pm2 stop all

# Ручной запуск
pkill -f "node.*server"
```

### 2. Обновление кода

```bash
git pull origin main
npm ci
```

### 3. Перезапуск

```bash
# Docker
docker-compose up -d

# PM2
pm2 start all

# Ручной запуск
# См. раздел "Ручное развертывание"
```

## 🚨 Устранение неполадок

### 1. Проверка статуса сервисов

```bash
# Проверка портов
netstat -tlnp | grep :3001
netstat -tlnp | grep :3012
netstat -tlnp | grep :3013

# Проверка процессов
ps aux | grep node

# Проверка логов
tail -f server.log
tail -f database.log
tail -f cache.log
```

### 2. Перезапуск сервисов

```bash
# PM2
pm2 restart all

# Docker
docker-compose restart

# Ручной перезапуск
pkill -f "node.*server"
# Затем запустить заново
```

### 3. Проверка базы данных

```bash
# MongoDB
mongo --host localhost --port 27017 -u admin -p secure_password
use neurotask
db.stats()

# Redis
redis-cli -a your_redis_password
ping
info
```

## 📞 Поддержка

При возникновении проблем:

1. **Проверьте логи** всех сервисов
2. **Проверьте статус** процессов и портов
3. **Проверьте конфигурацию** в .env файлах
4. **Проверьте зависимости** (MongoDB, Redis)
5. **Обратитесь к команде** разработки

### Полезные команды

```bash
# Статус системы
systemctl status mongod redis

# Использование ресурсов
htop
df -h
free -h

# Сетевые соединения
ss -tlnp
netstat -tlnp
```
