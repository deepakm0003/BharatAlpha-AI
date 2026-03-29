@echo off
title BharatAlpha AI Launcher
color 0A

echo.
echo  ██████╗ ██╗  ██╗ █████╗ ██████╗  █████╗ ████████╗
echo  ██╔══██╗██║  ██║██╔══██╗██╔══██╗██╔══██╗╚══██╔══╝
echo  ██████╔╝███████║███████║██████╔╝███████║   ██║   
echo  ██╔══██╗██╔══██║██╔══██║██╔══██╗██╔══██║   ██║   
echo  ██████╔╝██║  ██║██║  ██║██║  ██║██║  ██║   ██║   
echo  ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝  ╚═╝   
echo.
echo          BharatAlpha AI - ET Hackathon 2026
echo  ================================================
echo.

cd /d "%~dp0"

REM ── Step 1: Start Backend ─────────────────────────────────
echo  [1/3] Starting Backend API (FastAPI)...
if not exist backend\venv (
    echo        Creating Python venv...
    python -m venv backend\venv
)
call backend\venv\Scripts\activate.bat
pip install -r backend\requirements.txt -q --no-warn-script-location

start "BharatAlpha Backend" cmd /k "cd /d %~dp0backend && call venv\Scripts\activate.bat && python main.py && pause"
echo        Backend starting on http://localhost:8000 ...
timeout /t 3 > nul

REM ── Step 2: Try npm first ─────────────────────────────────
echo  [2/3] Setting up Frontend...

node --version > nul 2>&1
if errorlevel 1 goto :use_python

cd frontend
if not exist node_modules (
    echo        Installing packages (first time only, ~1 min)...
    call npm install
    if errorlevel 1 (
        cd ..
        goto :use_python
    )
)
cd ..

echo  [3/3] Starting Frontend (Vite)...
echo.
echo  ================================================
echo   OPEN: http://localhost:5173
echo  ================================================
echo.
start "" "http://localhost:5173"
cd frontend && call npm run dev
goto :done

:use_python
REM ── Fallback: Python server ───────────────────────────────
echo  [3/3] Starting Frontend (Python Server)...
echo.
echo  ================================================
echo   OPEN: http://localhost:3000
echo  ================================================
echo.
start "" "http://localhost:3000"
python "%~dp0serve_frontend.py"

:done
pause
