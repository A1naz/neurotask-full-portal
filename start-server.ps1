Write-Host "========================================" -ForegroundColor Green
Write-Host "Запуск основного сервера" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

Write-Host ""
Write-Host "Переход в папку server..." -ForegroundColor Yellow
Set-Location server

Write-Host ""
Write-Host "Запуск сервера на порту 3001..." -ForegroundColor Yellow
node server.js

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Сервер запущен!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "API доступен по адресу: http://localhost:3001/api" -ForegroundColor Cyan
Write-Host "Ping endpoint: http://localhost:3001/api/ping" -ForegroundColor Cyan
Write-Host "" 