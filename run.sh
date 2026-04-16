#!/bin/bash
# Development runner for ShipKit
# Run this to start the app during development

echo ""
echo "╔════════════════════════════════════════╗"
echo "║  ShipKit - Development Mode            ║"
echo "║  Press Ctrl+C to stop                  ║"
echo "╚════════════════════════════════════════╝"
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "[ERROR] Python 3 is not installed"
    exit 1
fi

# Check if dependencies are installed
if ! python3 -c "import fastapi" 2>/dev/null; then
    echo "[Setup] Installing Python dependencies..."
    pip install -r requirements.txt
fi

# Check if frontend build exists
if [ ! -d "frontend/build" ]; then
    echo "[Setup] Building React frontend..."
    npm run build
fi

# Start the app
echo "[Starting] ShipKit desktop application..."
python3 main.py
