@echo off
:: Instalador do protocolo abrir-pasta:
:: Executa como Administrador automaticamente se necessario

:: Verifica se esta rodando como admin
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo Solicitando permissao de Administrador...
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

echo.
echo  Instalando protocolo abrir-pasta:...
echo.

:: 1. Cria a pasta de destino
if not exist "C:\abrir-pasta" (
    mkdir "C:\abrir-pasta"
    echo  [OK] Pasta C:\abrir-pasta criada.
) else (
    echo  [OK] Pasta C:\abrir-pasta ja existe.
)

:: 2. Copia o handler VBS para a pasta
set "SCRIPT_DIR=%~dp0"
copy /Y "%SCRIPT_DIR%abrir-pasta-handler.vbs" "C:\abrir-pasta\abrir-pasta-handler.vbs" >nul
echo  [OK] Handler VBS copiado para C:\abrir-pasta\

:: 3. Importa o registro
reg import "%SCRIPT_DIR%ativar-pastas.reg" >nul 2>&1
echo  [OK] Protocolo registrado no Windows.

echo.
echo  Instalacao concluida! Teste clicando em um link abrir-pasta: no app.
echo.
pause
