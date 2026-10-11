@echo off
chcp 65001 > nul
title ConcursosTI - Servidor Local
echo ================================================================
echo           Iniciando ConcursosTI no seu computador...
echo ================================================================
echo.

:: Verificar se o Node.js está instalado
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERRO] Node.js não foi encontrado instalado no sistema.
    echo Baixe e instale o Node.js em: https://nodejs.org/
    pause
    exit /b 1
)

:: Abrir o navegador automaticamente após 1.5 segundos em segundo plano
start "" cmd /c "timeout /t 2 /nobreak >nul && start http://localhost:3000"

:: Iniciar o servidor Node.js
node server.js

pause
