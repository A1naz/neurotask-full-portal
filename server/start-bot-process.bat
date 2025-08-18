@echo off
echo Starting Telegram Bot Process...
echo.

REM Проверяем, установлены ли зависимости
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
    if errorlevel 1 (
        echo Failed to install dependencies
        pause
        exit /b 1
    )
)

REM Запускаем процесс бота
echo Starting bot process...
node telegram-bot-process.js

pause 