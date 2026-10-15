@echo off
title AutoDamage AI - Unseen Dataset Generalization Benchmark
cd /d "%~dp0"
echo =========================================================
echo Running Generalization Benchmark on Real Unseen Crash Data
echo =========================================================
call .venv\Scripts\activate.bat
python test_backend_full.py
pause
