#!/bin/bash

# BharatAlpha Startup Script for macOS/Linux
# This script sets up and runs both backend and frontend

echo ""
echo "========================================"
echo "  BharatAlpha v3.1 - Startup Script"
echo "========================================"
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "ERROR: Python3 is not installed"
    echo "Please install Python 3.8+ using:"
    echo "  macOS: brew install python3"
    echo "  Ubuntu/Debian: sudo apt-get install python3 python3-venv python3-pip"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed"
    echo "Please install Node.js from https://nodejs.org"
    exit 1
fi

echo "[1/4] Setting up Backend..."
cd backend

if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

echo "Activating virtual environment..."
source venv/bin/activate

echo "Installing Python dependencies..."
pip install -r requirements.txt > /dev/null 2>&1

if [ ! -f ".env" ]; then
    echo ""
    echo "WARNING: No .env file found!"
    echo "Please create backend/.env with:"
    echo "  ANTHROPIC_API_KEY=your_api_key_here"
    echo ""
    read -p "Press Enter to continue..."
fi

echo ""
echo "[2/4] Starting Backend (FastAPI)..."
echo "Backend will run on: http://localhost:8000"
echo "Press Ctrl+C in backend window to stop"
sleep 2

# Start backend in background
python main.py &
BACKEND_PID=$!

cd ..

echo ""
echo "[3/4] Setting up Frontend..."
cd frontend

if [ ! -d "node_modules" ]; then
    echo "Installing Node dependencies..."
    npm install > /dev/null 2>&1
fi

echo ""
echo "[4/4] Starting Frontend (Vite)..."
echo "Frontend will run on: http://localhost:5173"
echo ""
sleep 2

# Start frontend
npm run dev

# Clean up backend when script exits
kill $BACKEND_PID 2>/dev/null
