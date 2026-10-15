@echo off
title AutoDamage AI Pakistan - All-in-One Launcher
cd /d "%~dp0"
echo =========================================================
echo    ?? AutoDamage AI Pakistan - Vehicle Damage AI System
echo =========================================================
echo [1/3] Starting FastAPI & YOLOv11 Backend on Port 8000...
start "AutoDamage Backend" cmd /k "call .venv\Scripts\activate.bat && python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload"

echo [2/3] Waiting 3 seconds for AI service to initialize...
timeout /t 3 /nobreak >nul

echo [3/3] Starting Next.js 15 Frontend on Port 3000...
start "AutoDamage Frontend" cmd /k "cd /d "%~dp0\frontend" && npm run dev"

echo Opening Web Browser at http://localhost:3000...
timeout /t 3 /nobreak >nul
start http://localhost:3000

echo.
echo Both AI Backend and Next.js Frontend are running!
echo Backend API docs: http://localhost:8000/docs
echo Web Application: http://localhost:3000
echo.
pause
