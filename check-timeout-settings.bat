@echo off
echo ========================================
echo Проверка настроек таймаутов
echo ========================================
echo.

echo 1. Проверка nginx конфигурации...
nginx -t
if %errorlevel% equ 0 (
    echo ✅ Nginx конфигурация корректна
) else (
    echo ❌ Ошибка в nginx конфигурации
    pause
    exit /b 1
)
echo.

echo 2. Перезагрузка nginx...
nginx -s reload
if %errorlevel% equ 0 (
    echo ✅ Nginx перезагружен
) else (
    echo ❌ Ошибка перезагрузки nginx
)
echo.

echo 3. Проверка портов сервисов...
echo Проверяем Main Server (3001)...
netstat -an | findstr :3001 >nul
if %errorlevel% equ 0 (
    echo ✅ Main Server работает на порту 3001
) else (
    echo ❌ Main Server не найден на порту 3001
)

echo Проверяем Database Service (3012)...
netstat -an | findstr :3012 >nul
if %errorlevel% equ 0 (
    echo ✅ Database Service работает на порту 3012
) else (
    echo ❌ Database Service не найден на порту 3012
)
echo.

echo ========================================
echo Настройки таймаутов обновлены:
echo ========================================
echo 📋 Nginx proxy timeouts: 300s
echo 📋 Express server timeout: 300s  
echo 📋 Axios request timeout: 300s
echo 📋 Client body timeout: 300s
echo ========================================
echo.
echo 🧪 Теперь можно тестировать длительные запросы!
echo 🌐 Откройте: https://neurotask.ru/test-production-api.html
echo.
pause

