@echo off
echo ========================================
echo Запуск всех микросервисов проекта
echo ========================================

echo.
echo 1. Запуск Database Service...
start "Database Service" cmd /k "cd database-service && npm start"

echo.
echo 2. Запуск Cache Service...
start "Cache Service" cmd /k "cd cache-service && npm start"

echo.
echo 3. Запуск основного сервера...
start "Main Server" cmd /k "cd server && npm start"

echo.
echo 4. Запуск Balance Service...
start "Balance Service" cmd /k "cd balance-service && npm start"

echo.
echo 5. Запуск AI Gateway Service...
start "AI Gateway Service" cmd /k "cd ai-gateway-service && npm start"

echo.
echo 6. Запуск Telegram Bot Service...
start "Telegram Bot Service" cmd /k "cd telegram-bot-service && npm start"

echo.
echo 7. Запуск AI сервисов...
start "OpenAI Service" cmd /k "cd openai-service && npm start"
start "Gemini Service" cmd /k "cd gemini-service && npm start"
start "Anthropic Service" cmd /k "cd anthropic-service && npm start"
start "DeepSeek Service" cmd /k "cd deepseek-service && npm start"
start "xAI Service" cmd /k "cd xai-service && npm start"
start "GigaChat Service" cmd /k "cd gigachat-service && npm start"
start "YandexGPT Service" cmd /k "cd yandexgpt-service && npm start"

echo.
echo 8. Запуск фронтенда...
start "Frontend" cmd /k "npm run dev"

echo.
echo ========================================
echo Все сервисы запущены!
echo ========================================
echo.
echo Database Service: http://localhost:3003
echo Cache Service: http://localhost:3013
echo Основной сервер: http://localhost:3001
echo Balance Service: http://localhost:3002
echo AI Gateway: http://localhost:3004
echo Telegram Bot Service: http://localhost:3005
echo OpenAI Service: http://localhost:3006
echo Gemini Service: http://localhost:3007
echo Anthropic Service: http://localhost:3008
echo DeepSeek Service: http://localhost:3009
echo xAI Service: http://localhost:3010
echo GigaChat Service: http://localhost:3011
echo YandexGPT Service: http://localhost:3012
echo Frontend: http://localhost:5173
echo.
pause 