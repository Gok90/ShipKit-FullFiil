@echo off
REM Development runner for ShipKit (Windows)
REM Run this to start the app during development

echo.
echo ╔════════════════════════════════════════╗
echo ║  ShipKit - Development Mode            ║
echo ║  Press Ctrl+C to stop                  ║
echo ╚════════════════════════════════════════╝
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed or not in PATH
    pause
    exit /b 1
)

REM Check if dependencies are installed
python -c "import fastapi" >nul 2>&1
if errorlevel 1 (
    echo [Setup] Installing Python dependencies...
    pip install -r requirements.txt
)

REM Check if frontend build exists
if not exist "frontend\build" (
    echo [Setup] Building React frontend...
    call npm run build
)

REM Start the app
echo [Starting] ShipKit desktop application...
python main.py

pause
