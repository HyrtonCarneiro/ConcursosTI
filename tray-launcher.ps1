# tray-launcher.ps1
# Gerenciador de Bandeja para ConcursosTI

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

# Determinar diretorio do projeto
$projectDir = $PSScriptRoot
if ([string]::IsNullOrWhiteSpace($projectDir)) {
    $projectDir = Split-Path -Parent $MyInvocation.MyCommand.Path
}
if ([string]::IsNullOrWhiteSpace($projectDir)) {
    $projectDir = "c:\Users\Administrador\Desktop\DEV\ConcursosTI"
}

$serverScript = Join-Path $projectDir "server.js"
$iconPath = Join-Path $projectDir "favicon.ico"
$pidFile = Join-Path $projectDir "tray-launcher.pid"
$port = 3000
$siteUrl = "http://localhost:$port"

# Obter executavel do Node.js
$nodeCmd = Get-Command "node" -ErrorAction SilentlyContinue
$nodeExe = if ($nodeCmd) { $nodeCmd.Source } else { "node.exe" }

# Verificacao de processo unico via arquivo PID
if (Test-Path $pidFile) {
    try {
        $existingPid = [int](Get-Content $pidFile -ErrorAction Stop)
        $existingProc = Get-Process -Id $existingPid -ErrorAction SilentlyContinue
        if ($existingProc -and $existingProc.ProcessName -like "*powershell*") {
            # Ja existe instancia ativa da bandeja
            exit
        }
    } catch { }
}

# Salvar PID atual
$PID | Out-File -FilePath $pidFile -Force

# Contexto de aplicacao Windows Forms
$appContext = New-Object System.Windows.Forms.ApplicationContext

# Controle do processo do servidor Node
$script:nodeProcess = $null

function Start-ServerProcess {
    try {
        Stop-ServerProcess
        $psi = New-Object System.Diagnostics.ProcessStartInfo
        $psi.FileName = $nodeExe
        $psi.Arguments = "`"$serverScript`""
        $psi.WorkingDirectory = $projectDir
        $psi.CreateNoWindow = $true
        $psi.UseShellExecute = $false
        $psi.WindowStyle = [System.Diagnostics.ProcessWindowStyle]::Hidden

        $script:nodeProcess = [System.Diagnostics.Process]::Start($psi)
    } catch {
        [System.Windows.Forms.MessageBox]::Show("Erro ao iniciar o servidor Node.js: $_", "ConcursosTI - Erro", [System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::Error)
    }
}

function Stop-ServerProcess {
    if ($script:nodeProcess -and -not $script:nodeProcess.HasExited) {
        try {
            $script:nodeProcess.Kill()
            $script:nodeProcess.WaitForExit(2000)
        } catch { }
    }
    $script:nodeProcess = $null
}

function Cleanup-And-Exit {
    Stop-ServerProcess
    if (Test-Path $pidFile) {
        Remove-Item $pidFile -Force -ErrorAction SilentlyContinue
    }
    if ($notifyIcon) {
        $notifyIcon.Visible = $false
        $notifyIcon.Dispose()
    }
    $appContext.ExitThread()
}

# Iniciar o servidor Node.js imediatamente
Start-ServerProcess

# Criar Icone de Bandeja
$notifyIcon = New-Object System.Windows.Forms.NotifyIcon

if (Test-Path $iconPath) {
    try {
        $notifyIcon.Icon = New-Object System.Drawing.Icon($iconPath)
    } catch {
        $notifyIcon.Icon = [System.Drawing.SystemIcons]::Application
    }
} else {
    $notifyIcon.Icon = [System.Drawing.SystemIcons]::Application
}

$notifyIcon.Text = "ConcursosTI - Servidor Local"
$notifyIcon.Visible = $true

# Menu de contexto
$contextMenu = New-Object System.Windows.Forms.ContextMenuStrip

# 1. Abrir Site
$menuOpen = New-Object System.Windows.Forms.ToolStripMenuItem
$menuOpen.Text = "Abrir ConcursosTI (localhost:3000)"
$menuOpen.Font = New-Object System.Drawing.Font($menuOpen.Font, [System.Drawing.FontStyle]::Bold)
$menuOpen.Add_Click({
    Start-Process $siteUrl
})
$contextMenu.Items.Add($menuOpen) | Out-Null

# 2. Reiniciar Servidor
$menuRestart = New-Object System.Windows.Forms.ToolStripMenuItem
$menuRestart.Text = "Reiniciar Servidor"
$menuRestart.Add_Click({
    Start-ServerProcess
    $notifyIcon.ShowBalloonTip(2000, "ConcursosTI", "Servidor reiniciado com sucesso!", [System.Windows.Forms.ToolTipIcon]::Info)
})
$contextMenu.Items.Add($menuRestart) | Out-Null

# 3. Abrir Pasta do Projeto
$menuFolder = New-Object System.Windows.Forms.ToolStripMenuItem
$menuFolder.Text = "Abrir Pasta do Projeto"
$menuFolder.Add_Click({
    Start-Process "explorer.exe" $projectDir
})
$contextMenu.Items.Add($menuFolder) | Out-Null

# Separador
$contextMenu.Items.Add((New-Object System.Windows.Forms.ToolStripSeparator)) | Out-Null

# 4. Sair
$menuExit = New-Object System.Windows.Forms.ToolStripMenuItem
$menuExit.Text = "Encerrar Servidor e Sair"
$menuExit.Add_Click({
    Cleanup-And-Exit
})
$contextMenu.Items.Add($menuExit) | Out-Null

$notifyIcon.ContextMenuStrip = $contextMenu

# Clique duplo ou clique no balao abre o site
$notifyIcon.Add_DoubleClick({
    Start-Process $siteUrl
})

$notifyIcon.Add_BalloonTipClicked({
    Start-Process $siteUrl
})

# Notificacao inicial suave
$notifyIcon.ShowBalloonTip(2500, "ConcursosTI Online", "Servidor local rodando em $siteUrl", [System.Windows.Forms.ToolTipIcon]::Info)

# Evento ao desligar ou reiniciar o Windows
[Microsoft.Win32.SystemEvents]::add_SessionEnding({
    Cleanup-And-Exit
})

# Loop de mensagens
[System.Windows.Forms.Application]::Run($appContext)

# Limpeza caso saia do loop
Cleanup-And-Exit
