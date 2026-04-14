window.downloadsController = {
    render: function() {
    },

    toggleAnkiInstructions: function() {
        const el = document.getElementById('anki-instructions-area');
        if (!el) return;
        
        if (el.classList.contains('hidden')) {
            el.classList.remove('hidden');
            el.classList.add('animate-fade-in');
        } else {
            el.classList.add('hidden');
        }
    },

    copyAnkiConfig: function() {
        const config = {
            "webBindAddress": "0.0.0.0",
            "webBindPort": 8765,
            "webCorsOriginList": ["*"],
            "webExternalOrigins": ["*"]
        };
        const text = JSON.stringify(config, null, 4);
        navigator.clipboard.writeText(text).then(() => {
            window.utils.showToast("Configuração copiada!", "success");
        }).catch(err => {
            console.error('Erro ao copiar: ', err);
            window.utils.showToast("Erro ao copiar. Selecione o texto manualmente.", "error");
        });
    },

    downloadProtocoloPastas: function() {
        const regContent = 
`Windows Registry Editor Version 5.00\r\n` +
`\r\n` +
`[HKEY_CURRENT_USER\\Software\\Classes\\abrir-pasta]\r\n` +
`@="URL:Abrir Pasta Protocol"\r\n` +
`\"URL Protocol\"=\"\"\r\n` +
`\r\n` +
`[HKEY_CURRENT_USER\\Software\\Classes\\abrir-pasta\\shell]\r\n` +
`\r\n` +
`[HKEY_CURRENT_USER\\Software\\Classes\\abrir-pasta\\shell\\open]\r\n` +
`\r\n` +
`[HKEY_CURRENT_USER\\Software\\Classes\\abrir-pasta\\shell\\open\\command]\r\n` +
`@=\"powershell.exe -WindowStyle Hidden -Command \\\"Start-Process -FilePath ([System.Uri]::UnescapeDataString('%1') -replace '^abrir-pasta:', '')\\\"\"\r\n`;

        this._downloadFile('ativar-pastas.reg', regContent, 'text/plain');
        window.utils.showToast("Arquivo baixado! Dê duplo clique.", "success");
    },

    /**
     * Gera o script Python customizado para o Anki do usuário
     */
    downloadAnkiAddon: async function() {
        const state = window.store.getState();
        if (!state.isAuthenticated || !state.currentUser) {
            window.utils.showToast("Faça login para baixar o Add-on.", "error");
            return;
        }

        let userData = {};
        try {
            const userDoc = await window.db.collection('users').doc(state.currentUser).get();
            if (userDoc.exists) userData = userDoc.data();
        } catch(e) {}

        let monitorKey = userData.ankiMonitorKey;
        if (!monitorKey) {
            monitorKey = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
            await window.db.collection('users').doc(state.currentUser).update({ ankiMonitorKey: monitorKey });
        }

        const pyScript = `import json
import urllib.request
from aqt import mw, gui_hooks

# === CONFIGURAÇÃO AUTOMÁTICA ===
ENDPOINT = "https://concursosti.vercel.app/api/anki-sync/"
USERNAME = "${state.currentUser}"
MONITOR_KEY = "${monitorKey}"
# ===============================

def get_anki_counts():
    try:
        new = len(mw.col.find_cards("is:new"))
        learn = len(mw.col.find_cards("is:learn"))
        review = len(mw.col.find_cards("is:review is:due"))
        return {"new": new, "learn": learn, "review": review}
    except Exception as e:
        print(f"Erro ao contar cards: {e}")
        return None

def sync_to_cloud():
    counts = get_anki_counts()
    if not counts: return
    data = {"username": USERNAME, "key": MONITOR_KEY, "newCount": counts["new"], "learnCount": counts["learn"], "reviewCount": counts["review"]}
    req = urllib.request.Request(ENDPOINT)
    req.add_header('Content-Type', 'application/json; charset=utf-8')
    jsondata = json.dumps(data).encode('utf-8')
    try:
        urllib.request.urlopen(req, jsondata)
        print("Cloud Sync: Sucesso")
    except Exception as e:
        print(f"Erro ao sincronizar nuvem: {e}")

gui_hooks.sync_did_finish.append(sync_to_cloud)`;

        this._downloadFile('concursos_ti_sync.py', pyScript, 'text/x-python');
        window.utils.showToast("Add-on customizado baixado!", "success");
    },

    /**
     * Ferramenta de limpeza para remover o monitor antigo do PC
     */
    downloadCleanupTool: function() {
        const batContent = `@echo off
chcp 65001 >nul
title Faxina Anki Monitor
echo ========================================================
echo        FERRAMENTA DE LIMPEZA - ConcursosTI
echo ========================================================
echo:
echo 1. Encerrando processos antigos...
powershell -Command "$procs = Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*anki-monitor*' }; foreach ($p in $procs) { Stop-Process -Id $p.ProcessId -Force -ErrorAction SilentlyContinue }"
taskkill /F /IM powershell.exe /FI "WINDOWTITLE eq *AnkiMonitor*" /T 2>nul
taskkill /F /IM wscript.exe /FI "COMMANDLINE eq *anki-monitor*" /T 2>nul

echo 2. Removendo arquivos de inicialização...
set "startupDir=%APPDATA%\\Microsoft\\Windows\\Start Menu\\Programs\\Startup"
if exist "%startupDir%\\anki-monitor.vbs" del /F /Q "%startupDir%\\anki-monitor.vbs"

echo 3. Removendo pasta do monitor...
set "installDir=%USERPROFILE%\\AnkiMonitor"
if exist "%installDir%" (
    rd /S /Q "%installDir%"
)

echo:
echo ========================================================
echo       LIMPEZA CONCLUIDA! O entulho foi removido.
echo ========================================================
pause`;
        
        this._downloadFile('Limpar-Monitor-Antigo.bat', batContent, 'application/x-bat');
        window.utils.showToast("Ferramenta de limpeza baixada!", "success");
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
