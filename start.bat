@echo off
REM BharatAlpha AI - Startup Script (Windows)
REM Works with Node.js OR Python-only mode

echo.
echo ============================================
echo   BharatAlpha AI v3.1 - Startup
echo ============================================
echo.

REM --- Check Python ---
python --version > nul 2>&1
if errorlevel 1 (
    echo ERROR: Python not found. Install from https://www.python.org
    pause
    exit /b 1
)

REM --- Setup Backend ---
echo [1/3] Setting up Backend...
cd backend

if not exist venv (
    echo   Creating virtual environment...
    python -m venv venv
)

call venv\Scripts\activate.bat
echo   Installing backend dependencies...
pip install -r requirements.txt -q

echo   Starting backend on http://localhost:8000 ...
start cmd /k "cd /d %~dp0backend && call venv\Scripts\activate.bat && python main.py"
cd ..

echo.
echo [2/3] Waiting for backend to start...
timeout /t 4 > nul

REM --- Try Node.js first, fall back to Python server ---
echo [3/3] Starting Frontend...
node --version > nul 2>&1
if errorlevel 1 (
    goto :python_server
)

cd frontend

if not exist node_modules (
    echo   node_modules missing - running npm install...
    echo   This may take 1-2 minutes, please wait...
    call npm install
    if errorlevel 1 (
        echo   npm install failed, falling back to Python server
        cd ..
        goto :python_server
    )
)

echo   Starting Vite dev server on http://localhost:5173 ...
echo.
echo ============================================
echo   OPEN IN BROWSER: http://localhost:5173
echo ============================================
echo.
start "" "http://localhost:5173"
call npm run dev
goto :end

:python_server
echo   Node.js not found or npm failed - using Python server...
echo   Starting Python server on http://localhost:3000 ...
echo.
echo ============================================
echo   OPEN IN BROWSER: http://localhost:3000
echo ============================================
echo.
start "" "http://localhost:3000"
python serve_frontend.py

:end
pause
