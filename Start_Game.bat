@echo off
setlocal
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0Start_Game.ps1"
echo.
echo Press any key to close this launcher window. The game server keeps running in the background.
pause >nul
