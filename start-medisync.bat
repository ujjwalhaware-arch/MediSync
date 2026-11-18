@echo off
cd /d "%~dp0"
title MediSync Launcher
echo ========================================================
echo    Starting MediSync - Healthcare Medication System
echo ========================================================
echo.

echo [1/3] Launching Backend Server on http://localhost:5000 ...
start "MediSync Backend Server (Port 5000)" cmd /k "cd /d "%~dp0server" && npm run dev"

timeout /t 3 /nobreak >nul

echo [2/3] Launching Frontend Client on http://localhost:5173 ...
start "MediSync Frontend Vite (Port 5173)" cmd /k "cd /d "%~dp0client" && npm run dev"

timeout /t 4 /nobreak >nul

echo [3/3] Opening browser at http://localhost:5173 ...
start http://localhost:5173

echo.
echo ========================================================
echo    MediSync is now running!
echo    - Web App: http://localhost:5173
echo    - API:     http://localhost:5000/api
echo ========================================================
echo Keep the backend and frontend terminal windows open.
echo.
pause
