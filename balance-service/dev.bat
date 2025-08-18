@echo off
echo Starting Balance Service in development mode...
echo.

REM Проверяем, установлен ли Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Node.js is not installed or not in PATH
    pause
    exit /b 1
)

REM Проверяем, существует ли .env файл
if not exist .env (
    echo Warning: .env file not found. Creating from example...
    copy env.example .env
    echo Please configure .env file with your settings
    pause
)

REM Устанавливаем зависимости, если node_modules не существует
if not exist node_modules (
    echo Installing dependencies...
    npm install
)

REM Запускаем сервис в режиме разработки
echo Starting Balance Service in development mode on port 3002...
echo Health check: http://localhost:3002/api/health
echo.
npm run dev

pause 