@echo off
REM Starts the Thkee app with its local API, then opens it in the browser.
cd /d "%~dp0"
start "Thkee App" cmd /k npm run dev
timeout /t 5 >nul
start "" http://localhost:8443
