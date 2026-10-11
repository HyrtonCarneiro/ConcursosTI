' iniciar_bandeja.vbs
' Inicia o ConcursosTI Tray Launcher de forma 100% silenciosa
Set WshShell = CreateObject("WScript.Shell")
Set FSO = CreateObject("Scripting.FileSystemObject")
strDir = FSO.GetParentFolderName(WScript.ScriptFullName)
strCmd = "powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File """ & strDir & "\tray-launcher.ps1"""
WshShell.CurrentDirectory = strDir
WshShell.Run strCmd, 0, False
