Set WshShell = CreateObject("WScript.Shell")
' Run run-24-7.bat hidden (0 = invisible window, false = don't wait)
WshShell.Run "cmd /c """ & CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName) & "\run-24-7.bat""", 0, False
