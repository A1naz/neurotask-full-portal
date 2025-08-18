@echo off
echo ========================================
echo Запуск основного сервера
echo ========================================

echo.
echo Переход в папку server...
cd server

echo.
echo Запуск сервера на порту 3001...
node server.js

echo.
echo ========================================
echo Сервер запущен!
echo ========================================
echo.
echo API доступен по адресу: http://localhost:3001/api
echo Ping endpoint: http://localhost:3001/api/ping
echo.
pause 