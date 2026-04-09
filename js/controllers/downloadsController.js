window.downloadsController = {
    render: function() {
    },

    downloadProtocoloPastas: function() {
        const regContent = 
`Windows Registry Editor Version 5.00\r\n` +
`\r\n` +
`[HKEY_CURRENT_USER\\Software\\Classes\\abrir-pasta]\r\n` +
`@="URL:Abrir Pasta Protocol"\r\n` +
`"URL Protocol"=""\r\n` +
`\r\n` +
`[HKEY_CURRENT_USER\\Software\\Classes\\abrir-pasta\\shell]\r\n` +
`\r\n` +
`[HKEY_CURRENT_USER\\Software\\Classes\\abrir-pasta\\shell\\open]\r\n` +
`\r\n` +
`[HKEY_CURRENT_USER\\Software\\Classes\\abrir-pasta\\shell\\open\\command]\r\n` +
`@="powershell.exe -WindowStyle Hidden -Command \\"Start-Process -FilePath ([System.Uri]::UnescapeDataString('%1') -replace '^abrir-pasta:', '')\\""\r\n`;

        this._downloadFile('ativar-pastas.reg', regContent, 'text/plain');
        window.utils.showToast("Arquivo baixado! Dê duplo clique.", "success");
    },

    downloadMonitorAnki: async function() {
        const state = window.store.getState();
        if (!state.isAuthenticated || !state.currentUser) {
            window.utils.showToast("Faça login para baixar o monitor.", "error");
            return;
        }

        let fcmToken = state.fcmToken;
        if (!fcmToken) {
            try {
                const userDoc = await window.db.collection('users').doc(state.currentUser).get();
                if (userDoc.exists) {
                    fcmToken = userDoc.data().fcmToken || (userDoc.data().state ? userDoc.data().state.fcmToken : null);
                }
            } catch(e) { console.error(e); }
        }

        if (!fcmToken) {
            window.utils.showToast("Ative as notificações no celular primeiro (Dashboard).", "error");
            return;
        }

        const batContent = this._gerarInstaladorBat(fcmToken);
        this._downloadFile('Instalar-Monitor-Anki.bat', batContent, 'application/x-bat');
        window.utils.showToast("Instalador baixado!", "success");
    },

    _gerarInstaladorBat: function(fcmToken) {
        // Usando comandos individuais linha por linha (mais seguro contra erros de sintaxe no CMD)
        return `@echo off
chcp 65001 >nul
title Instalando Monitor Anki...
set "INSTALL_DIR=%USERPROFILE%\\AnkiMonitor"
set "PS_FILE=%INSTALL_DIR%\\anki-monitor.ps1"
set "CFG_FILE=%INSTALL_DIR%\\config.json"
set "VBS_FILE=%INSTALL_DIR%\\anki-monitor.vbs"
set "TST_FILE=%INSTALL_DIR%\\TESTAR-NOTIFICACAO.bat"

echo.
echo ============================================
echo   INSTALADOR DO MONITOR ANKI - ConcursosTI
echo ============================================
echo.

echo [1/6] Criando pasta: %INSTALL_DIR%
if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"

echo [2/6] Gerando script de monitoramento...
echo $PSScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Definition > "%PS_FILE%"
echo $configFile = Join-Path $PSScriptRoot "config.json" >> "%PS_FILE%"
echo $logFile = Join-Path $PSScriptRoot "monitor.log" >> "%PS_FILE%"
echo function Log-Msg($msg) { >> "%PS_FILE%"
echo     $ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss" >> "%PS_FILE%"
echo     Add-Content -Path $logFile -Value "[$ts] $msg" >> "%PS_FILE%"
echo } >> "%PS_FILE%"
echo if (-not (Test-Path $configFile)) { exit } >> "%PS_FILE%"
echo while ($true) { >> "%PS_FILE%"
echo     try { >> "%PS_FILE%"
echo         $config = Get-Content $configFile ^| ConvertFrom-Json >> "%PS_FILE%"
echo         $hoje = Get-Date -Format "yyyy-MM-dd" >> "%PS_FILE%"
echo         if ($config.lastNotifiedDate -ne $hoje) { >> "%PS_FILE%"
echo             $qNew = @{ action = 'findCards'; version = 6; params = @{ query = 'is:new' } } ^| ConvertTo-Json >> "%PS_FILE%"
echo             $qLrn = @{ action = 'findCards'; version = 6; params = @{ query = 'is:learn' } } ^| ConvertTo-Json >> "%PS_FILE%"
echo             $qRev = @{ action = 'findCards'; version = 6; params = @{ query = 'is:review is:due' } } ^| ConvertTo-Json >> "%PS_FILE%"
echo             $rNew = Invoke-RestMethod -Uri 'http://localhost:8765' -Method Post -Body $qNew -ErrorAction Stop >> "%PS_FILE%"
echo             $rLrn = Invoke-RestMethod -Uri 'http://localhost:8765' -Method Post -Body $qLrn -ErrorAction Stop >> "%PS_FILE%"
echo             $rRev = Invoke-RestMethod -Uri 'http://localhost:8765' -Method Post -Body $qRev -ErrorAction Stop >> "%PS_FILE%"
echo             $total = $rNew.result.Count + $rLrn.result.Count + $rRev.result.Count >> "%PS_FILE%"
echo             if ($total -gt 0) { >> "%PS_FILE%"
echo                 $bodyText = "Voce tem $total cards pendentes (Novos: $($rNew.result.Count) | Aprender: $($rLrn.result.Count) | Revisar: $($rRev.result.Count))" >> "%PS_FILE%"
echo                 $bodyPush = @{ token = $config.fcmToken; title = 'Estudos Pendentes'; body = $bodyText } ^| ConvertTo-Json >> "%PS_FILE%"
echo                 Invoke-RestMethod -Uri "https://concursosti.vercel.app/api/notify" -Method Post -Body $bodyPush -ContentType "application/json" >> "%PS_FILE%"
echo                 $config.lastNotifiedDate = $hoje >> "%PS_FILE%"
echo                 $config ^| ConvertTo-Json ^| Set-Content $configFile >> "%PS_FILE%"
echo             } >> "%PS_FILE%"
echo         } >> "%PS_FILE%"
echo     } catch {} >> "%PS_FILE%"
echo     Start-Sleep -Seconds 1800 >> "%PS_FILE%"
echo } >> "%PS_FILE%"

echo [3/6] Configurando credenciais...
echo { > "%CFG_FILE%"
echo   "fcmToken": "${fcmToken}", >> "%CFG_FILE%"
echo   "lastNotifiedDate": "" >> "%CFG_FILE%"
echo } >> "%CFG_FILE%"

echo [4/6] Configurando execucao silenciosa...
echo Set WshShell = CreateObject("WScript.Shell") > "%VBS_FILE%"
echo WshShell.Run "powershell.exe -ExecutionPolicy Bypass -WindowStyle Hidden -File """ ^& Replace(WScript.ScriptFullName, WScript.ScriptName, "") ^& "anki-monitor.ps1""", 0, False >> "%VBS_FILE%"

echo [5/6] Adicionando a inicializacao do Windows...
copy "%VBS_FILE%" "%APPDATA%\\Microsoft\\Windows\\Start Menu\\Programs\\Startup\\anki-monitor.vbs" >nul

echo [6/6] Criando arquivo de teste...
echo @echo off > "%TST_FILE%"
echo echo Consultando Anki... >> "%TST_FILE%"
echo powershell.exe -ExecutionPolicy Bypass -Command "$config = Get-Content '%INSTALL_DIR%\\config.json' ^| ConvertFrom-Json; $qNew = @{ action = 'findCards'; version = 6; params = @{ query = 'is:new' } } ^| ConvertTo-Json; $qLrn = @{ action = 'findCards'; version = 6; params = @{ query = 'is:learn' } } ^| ConvertTo-Json; $qRev = @{ action = 'findCards'; version = 6; params = @{ query = 'is:review is:due' } } ^| ConvertTo-Json; $rNew = Invoke-RestMethod -Uri 'http://localhost:8765' -Method Post -Body $qNew; $rLrn = Invoke-RestMethod -Uri 'http://localhost:8765' -Method Post -Body $qLrn; $rRev = Invoke-RestMethod -Uri 'http://localhost:8765' -Method Post -Body $qRev; $total = $rNew.result.Count + $rLrn.result.Count + $rRev.result.Count; $bodyText = 'TESTE: ' + $total + ' cards (N: ' + $rNew.result.Count + ' | A: ' + $rLrn.result.Count + ' | R: ' + $rRev.result.Count + ')'; $bodyPush = @{ token = $config.fcmToken; title = 'Teste de Notificacao'; body = $bodyText } ^| ConvertTo-Json; Invoke-RestMethod -Uri 'https://concursosti.vercel.app/api/notify' -Method Post -Body $bodyPush -ContentType 'application/json'; echo OK: Notificacao enviada!" >> "%TST_FILE%"
echo pause >> "%TST_FILE%"

echo.
echo ============================================
echo   CONCLUIDO! O MONITOR JA ESTA ATIVO.
echo ============================================
echo.
echo   Pasta de instalacao: %INSTALL_DIR%
echo   Para testar agora, abra a pasta e execute:
echo   ---^> TESTAR-NOTIFICACAO.bat
echo.
pause
`;
    },

    _downloadFile: function(filename, content, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    }
};
