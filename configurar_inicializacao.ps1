# configurar_inicializacao.ps1
# Configura o ConcursosTI para iniciar automaticamente com o Windows e cria atalhos

param(
    [switch]$Desinstalar
)

$wsh = New-Object -ComObject WScript.Shell
$startupPath = [Environment]::GetFolderPath('Startup')
$desktopPath = [Environment]::GetFolderPath('Desktop')
$startupShortcut = Join-Path $startupPath "ConcursosTI - Servidor.lnk"
$desktopShortcut = Join-Path $desktopPath "ConcursosTI.lnk"
$projectDir = $PSScriptRoot
$vbsPath = Join-Path $projectDir "iniciar_bandeja.vbs"
$icoPath = Join-Path $projectDir "favicon.ico"

if ($Desinstalar) {
    if (Test-Path $startupShortcut) {
        Remove-Item $startupShortcut -Force
        Write-Host "Inicializacao automatica com o Windows desativada." -ForegroundColor Yellow
    }
    return
}

# 1. Criar atalho na pasta Inicializar do Windows
$shortcutStartup = $wsh.CreateShortcut($startupShortcut)
$shortcutStartup.TargetPath = "wscript.exe"
$shortcutStartup.Arguments = "`"$vbsPath`""
$shortcutStartup.WorkingDirectory = $projectDir
if (Test-Path $icoPath) {
    $shortcutStartup.IconLocation = "$icoPath,0"
}
$shortcutStartup.Description = "Inicializador em Segundo Plano do ConcursosTI"
$shortcutStartup.Save()

# 2. Criar atalho pratico na Area de Trabalho
$shortcutDesktop = $wsh.CreateShortcut($desktopShortcut)
$shortcutDesktop.TargetPath = "wscript.exe"
$shortcutDesktop.Arguments = "`"$vbsPath`""
$shortcutDesktop.WorkingDirectory = $projectDir
if (Test-Path $icoPath) {
    $shortcutDesktop.IconLocation = "$icoPath,0"
}
$shortcutDesktop.Description = "Iniciar ConcursosTI na Bandeja"
$shortcutDesktop.Save()

Write-Host "Configuracao concluida com sucesso!" -ForegroundColor Green
Write-Host "1. Inicializacao com o Windows: $startupShortcut" -ForegroundColor Gray
Write-Host "2. Atalho na Area de Trabalho:  $desktopShortcut" -ForegroundColor Gray
