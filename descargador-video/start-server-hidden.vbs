' Arranca start-server.bat sin mostrar ventana de consola.
' Uselo para el autoarranque silencioso de Windows.
Set WshShell = CreateObject("WScript.Shell")
strPath = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName)
WshShell.Run Chr(34) & strPath & "\start-server.bat" & Chr(34), 0, False
