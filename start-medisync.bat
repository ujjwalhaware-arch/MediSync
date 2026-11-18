@echo off
echo ========================================================
echo    Starting MediSync - Intelligent Medicine Management
echo ========================================================
echo.

echo [1/2] Launching Backend Server on http://localhost:5000 ...
start "MediSync Backend Server" cmd /k "cd server && npm run dev"

timeout /t 3 /nobreak >nul

echo [2/2] Launching Frontend Client on http://localhost:5173 ...
start "MediSync Frontend" cmd /k "cd client && npm run dev"

echo.
echo ========================================================
echo    MediSync is now running!
echo    - Frontend: http://localhost:5173
echo    - Backend:  http://localhost:5000/api
echo ========================================================
pause

