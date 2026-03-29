@echo off
REM BharatAlpha Startup Script for Windows
REM This script sets up and runs both backend and frontend

echo.
echo ========================================
echo  BharatAlpha v3.1 - Startup Script
echo ========================================
echo.

REM Check if Python is installed
python --version > nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.8+ from https://www.python.org
    pause
    exit /b 1
)

REM Check if Node.js is installed
node --version > nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

echo [1/4] Setting up Backend...
cd backend

if not exist venv (
    echo Creating virtual environment...
    python -m venv venv
)

echo Activating virtual environment...
call venv\Scripts\activate.bat

echo Installing Python dependencies...
pip install -r requirements.txt > nul 2>&1

if not exist .env (
    echo.
    echo WARNING: No .env file found!
    echo Please create backend\.env with:
    echo   ANTHROPIC_API_KEY=your_api_key_here
    echo.
    pause
)

echo.
echo [2/4] Starting Backend (FastAPI)...
echo Backend will run on: http://localhost:8000
echo Press Ctrl+C in backend window to stop
timeout /t 2 > nul
start cmd /k python main.py

cd ..

echo.
echo [3/4] Setting up Frontend...
cd frontend

if not exist node_modules (
    echo Installing Node dependencies...
    call npm install > nul 2>&1
)

echo.
echo [4/4] Starting Frontend (Vite)...
echo Frontend will run on: http://localhost:5173
echo.
timeout /t 3 > nul
call npm run dev

pause
