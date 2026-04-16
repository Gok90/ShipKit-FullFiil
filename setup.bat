@echo off
title ShipKit - First Time Setup
color 0B

echo.
echo ========================================
echo   ShipKit - First Time Setup
echo ========================================
echo.
echo This will install all required dependencies.
echo Please wait, this may take a few minutes...
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed or not in PATH.
    echo Please install Python from https://python.org
    echo Make sure to check "Add Python to PATH" during installation.
    pause
    exit /b 1
)

echo [1/4] Python found. Installing Python packages...
pip install pywebview fastapi uvicorn aiosqlite python-multipart pydantic --quiet
if errorlevel 1 (
    echo [ERROR] Failed to install Python packages.
    pause
    exit /b 1
)
echo       Done!

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo.
    echo [WARNING] Node.js is not installed.
    echo The app can still run but you need to build the frontend first.
    echo Install Node.js from https://nodejs.org if you want to modify the UI.
    echo.
    echo For now, we'll use the pre-built version...
    goto :skip_node
)

echo [2/4] Node.js found. Installing Node packages...
call npm install --silent 2>nul
if errorlevel 1 (
    echo       npm install had some warnings, continuing...
)
echo       Done!

echo [3/4] Building React frontend...
call npm run build --silent 2>nul
if errorlevel 1 (
    echo       Build had issues, will try to use existing build...
)
echo       Done!

:skip_node

echo [4/4] Creating data folders...
if not exist "data" mkdir data
if not exist "uploads" mkdir uploads
if not exist "audio" mkdir audio
echo       Done!

echo.
echo ========================================
echo   Setup Complete!
echo ========================================
echo.
echo To start ShipKit, double-click: run.bat
echo.
pause
