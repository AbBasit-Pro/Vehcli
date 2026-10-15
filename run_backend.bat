@echo off
title AutoDamage AI - Backend Service (Port 8000)
cd /d "%~dp0"
echo =========================================================
echo Starting AutoDamage AI - FastAPI & YOLOv11 Backend
echo =========================================================
call .venv\Scripts\activate.bat
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
pause
