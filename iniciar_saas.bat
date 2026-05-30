@echo off
title ScreenSnap API v1.1 — R$100/dia
cd /d "%~dp0"

echo ========================================
echo   🔥 ScreenSnap API v1.1
echo   R$100/dia — Screenshot como Servico
echo ========================================
echo.

:: Verificar se porta 3000 esta livre
netstat -ano | find ":3000" >nul 2>&1
if %errorlevel% equ 0 (
    echo ⚠️  Porta 3000 ocupada. Encerrando processo antigo...
    for /f "tokens=5" %%a in ('netstat -ano ^| find ":3000"') do (
        if not "%%a"=="" taskkill /f /pid %%a >nul 2>&1
    )
    timeout /t 2 /nobreak >nul
)

echo 🚀 Iniciando servidor...
echo 📊 Health: http://localhost:3000/health
echo 📋 Docs:   http://localhost:3000/docs
echo 🎮 Play:   http://localhost:3000/play
echo 🔑 Signup: http://localhost:3000/signup
echo.

node index.js

pause
