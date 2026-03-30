window.linksController = {
    init: function() {
        this.cacheDOM();
        this.bindEvents();
    },

    cacheDOM: function() {
        this.container = document.getElementById('container-links-uteis');
        this.btnAdd = document.getElementById('btn-add-link-uteis');
        this.modal = document.getElementById('modal-link-uteis');
        this.modalContent = document.getElementById('modal-link-uteis-content');
        this.form = document.getElementById('form-link-uteis');
        this.inputTitulo = document.getElementById('input-link-titulo');
        this.inputUrl = document.getElementById('input-link-url');
    },

    bindEvents: function() {
        if (this.btnAdd) {
            this.btnAdd.addEventListener('click', () => this.abrirModal());
        }
        if (this.form) {
            this.form.addEventListener('submit', (e) => this.handleSalvar(e));
        }
    },

    abrirModal: function() {
        this.modal.classList.remove('hidden');
        this.modal.classList.add('flex');
        this.form.reset();
        requestAnimationFrame(() => {
            this.modalContent.classList.remove('scale-95', 'opacity-0');
        });
    },

    fecharModal: function() {
        this.modalContent.classList.add('scale-95', 'opacity-0');
        setTimeout(() => {
            this.modal.classList.add('hidden');
            this.modal.classList.remove('flex');
        }, 200);
    },

    handleSalvar: function(e) {
        e.preventDefault();
        try {
            window.store.addLinkUteis(this.inputTitulo.value, this.inputUrl.value);
            window.utils.showToast("Link salvo com sucesso!", "success");
            this.fecharModal();
            this.render();
        } catch (err) {
            window.utils.showToast(err.message, "error");
        }
    },

    render: function() {
        if (!this.container) return;
        const links = window.store.getState().linksUteis || [];
        
        this.container.innerHTML = "";

        if (links.length === 0) {
            this.container.innerHTML = `
                <div class="col-span-full bg-white p-12 rounded-[2.5rem] border border-dashed border-gray-200 text-center">
                    <div class="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-gray-300">
                        <i class="ph ph-link-break text-4xl"></i>
                    </div>
                    <h3 class="text-lg font-bold text-gray-800 mb-2">Nenhum link salvo</h3>
                    <p class="text-gray-500 mb-6">Comece adicionando seus sites de estudo favoritos.</p>
                </div>
            `;
            return;
        }

        links.forEach(link => {
            const card = document.createElement('div');
            card.className = "bg-white p-6 rounded-[2rem] border border-gray-100 hover:border-primary-500 transition-all shadow-sm hover:shadow-xl hover:-translate-y-1 group relative flex items-center gap-4";
            
            // Icon Logic based on common study sites
            let iconClass = "ph ph-link";
            let iconBg = "bg-gray-100 text-gray-400";
            
            const url = link.url.toLowerCase();
            const isLocal = /^[a-zA-Z]:[\\\/]/.test(link.url);
            
            if (isLocal) {
                iconClass = "ph-bold ph-folder-open";
                iconBg = "bg-amber-50 text-amber-600";
            } else {
                if (url.includes('google')) { iconClass = "ph-bold ph-google-logo"; iconBg = "bg-blue-50 text-blue-500"; }
                if (url.includes('notebooklm')) { iconClass = "ph-bold ph-brain"; iconBg = "bg-purple-50 text-purple-600"; }
                if (url.includes('youtube')) { iconClass = "ph-bold ph-youtube-logo"; iconBg = "bg-red-50 text-red-500"; }
                if (url.includes('notion')) { iconClass = "ph-bold ph-notebook"; iconBg = "bg-gray-900 text-white"; }
                if (url.includes('concurso')) { iconClass = "ph-bold ph-exam"; iconBg = "bg-green-50 text-green-600"; }
            }

            const finalHref = isLocal ? `abrir-pasta:${link.url}` : link.url;
            const displayUrl = isLocal ? link.url : link.url.replace('https://', '').replace('http://', '').split('/')[0];

            card.innerHTML = `
                <div class="w-12 h-12 ${iconBg} rounded-2xl flex items-center justify-center text-xl shrink-0 transition-transform group-hover:scale-110">
                    <i class="${iconClass}"></i>
                </div>
                <div class="flex-1 min-w-0">
                    <h4 class="text-sm font-black text-gray-900 truncate mb-0.5">${link.titulo}</h4>
                    <a href="${finalHref}" ${isLocal ? '' : 'target="_blank"'} class="text-[10px] font-bold text-primary-600 truncate block hover:underline">
                        ${displayUrl}
                    </a>
                </div>
                <button onclick="window.linksController.remover('${link.id}')" class="w-8 h-8 rounded-lg bg-gray-50 text-gray-300 hover:bg-red-50 hover:text-red-500 transition-all active:scale-95 flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <i class="ph-bold ph-trash"></i>
                </button>
            `;
            this.container.appendChild(card);
        });
    },

    remover: function(id) {
        if (confirm("Deseja remover este link?")) {
            window.store.removeLinkUteis(id);
            this.render();
            window.utils.showToast("Link removido.", "info");
        }
    },

    downloadInstalador: function() {
        // VBScript handler content (silent, no window)
        const vbsContent = `' Handler silencioso para o protocolo abrir-pasta:
' Executado por wscript.exe (sem janela de console)
Dim url, path, shell
url = WScript.Arguments(0)
path = url
path = Replace(path, "abrir-pasta://", "")
path = Replace(path, "abrir-pasta:", "")
path = Replace(path, "%20", " ")
path = Replace(path, "%5C", "\\")
path = Replace(path, "%3A", ":")
path = Replace(path, "%2F", "\\")
path = Replace(path, "/", "\\")
Do While Left(path, 2) = "\\\\"
    path = Mid(path, 2)
Loop
Set shell = CreateObject("WScript.Shell")
shell.Run "explorer.exe """ & path & """", 0, False
Set shell = Nothing
WScript.Quit 0`;

        // Registry content
        const regContent = `Windows Registry Editor Version 5.00

[HKEY_CLASSES_ROOT\\abrir-pasta]
@="URL:Abrir Pasta Protocol"
"URL Protocol"=""

[HKEY_CLASSES_ROOT\\abrir-pasta\\shell]

[HKEY_CLASSES_ROOT\\abrir-pasta\\shell\\open]

[HKEY_CLASSES_ROOT\\abrir-pasta\\shell\\open\\command]
@="wscript.exe //nologo //b \\"C:\\\\abrir-pasta\\\\abrir-pasta-handler.vbs\\" \\"%1\\""`;

        // BAT installer that creates folder, writes VBS and imports REG — all silently
        const batContent = `@echo off
net session >nul 2>&1
if %errorLevel% neq 0 (
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)
if not exist "C:\\abrir-pasta" mkdir "C:\\abrir-pasta"
(
echo ' Handler silencioso para o protocolo abrir-pasta:
echo Dim url, path, shell
echo url = WScript.Arguments(0^)
echo path = url
echo path = Replace(path, "abrir-pasta://", ""^)
echo path = Replace(path, "abrir-pasta:", ""^)
echo path = Replace(path, "%%20", " "^)
echo path = Replace(path, "%%5C", "\\"^)
echo path = Replace(path, "%%3A", ":"^)
echo path = Replace(path, "%%2F", "\\"^)
echo path = Replace(path, "/", "\\"^)
echo Do While Left(path, 2^) = "\\\\"
echo path = Mid(path, 2^)
echo Loop
echo Set shell = CreateObject("WScript.Shell"^)
echo shell.Run "explorer.exe """ ^& path ^& """", 0, False
echo Set shell = Nothing
echo WScript.Quit 0
) > "C:\\abrir-pasta\\abrir-pasta-handler.vbs"
(
echo Windows Registry Editor Version 5.00
echo.
echo [HKEY_CLASSES_ROOT\\abrir-pasta]
echo @="URL:Abrir Pasta Protocol"
echo "URL Protocol"=""
echo.
echo [HKEY_CLASSES_ROOT\\abrir-pasta\\shell]
echo.
echo [HKEY_CLASSES_ROOT\\abrir-pasta\\shell\\open]
echo.
echo [HKEY_CLASSES_ROOT\\abrir-pasta\\shell\\open\\command]
echo @="wscript.exe //nologo //b \\"C:\\\\abrir-pasta\\\\abrir-pasta-handler.vbs\\" \\"%1\\""
) > "%TEMP%\\abrir-pasta-temp.reg"
regedit /s "%TEMP%\\abrir-pasta-temp.reg"
del "%TEMP%\\abrir-pasta-temp.reg" >nul 2>&1
exit /b 0`;

        const blob = new Blob([batContent], { type: 'application/octet-stream' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'instalar-protocolo-pastas.bat';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        window.utils.showToast("Instalador baixado! Execute como Administrador para ativar.", "success");
    },

    // Alias for backward compatibility
    downloadReg: function() { this.downloadInstalador(); }
};
