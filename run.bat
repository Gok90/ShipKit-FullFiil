@echo off
title ShipKit
color 0B

echo.
echo ========================================
echo   ShipKit - Local Fulfillment Tool
echo ========================================
echo.

REM Create folders if they don't exist
if not exist "data" mkdir data
if not exist "uploads" mkdir uploads

REM Check if Python dependencies are installed
python -c "import fastapi" >nul 2>&1
if errorlevel 1 (
    echo [Setup] Installing Python dependencies...
    echo         This only happens once...
    echo.
    pip install fastapi uvicorn aiosqlite python-multipart pydantic
    if errorlevel 1 (
        echo.
        echo [ERROR] Failed to install dependencies.
        echo Make sure Python is installed correctly.
        pause
        exit /b 1
    )
    echo.
    echo [Setup] Dependencies installed successfully!
    echo.
)

echo Starting ShipKit...
echo.
echo Opening http://127.0.0.1:8000 in your browser...
echo Press Ctrl+C to stop the app.
echo.

python main.py

if errorlevel 1 (
    echo.
    echo ========================================
    echo [ERROR] ShipKit failed to start.
    echo ========================================
    echo.
    echo Common fixes:
    echo 1. Make sure Python 3.8+ is installed
    echo 2. Try running: pip install fastapi uvicorn aiosqlite python-multipart pydantic
    echo 3. Check the error message above
    echo.
)

pause
