@echo off
setlocal
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0Stop_Game.ps1"
echo.
pause
