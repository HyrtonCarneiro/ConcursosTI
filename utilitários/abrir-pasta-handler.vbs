' Handler silencioso para o protocolo abrir-pasta:
' Executado por wscript.exe (sem janela de console)

Dim url, path, shell

url = WScript.Arguments(0)

' Remove o prefixo do protocolo
path = url
path = Replace(path, "abrir-pasta:", "")
path = Replace(path, "abrir-pasta://", "")

' Decodifica URL encoding (%20 -> espaço, etc.)
path = Replace(path, "%20", " ")
path = Replace(path, "%5C", "\")
path = Replace(path, "%3A", ":")
path = Replace(path, "%2F", "\")
path = Replace(path, "/", "\")

' Remove barras duplas no início se houver
Do While Left(path, 2) = "\\"
    path = Mid(path, 2)
Loop

' Abre o Explorer silenciosamente (sem janela alguma)
Set shell = CreateObject("WScript.Shell")
shell.Run "explorer.exe """ & path & """", 0, False

Set shell = Nothing
WScript.Quit 0
