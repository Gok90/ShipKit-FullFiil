#!/bin/bash

echo ""
echo "========================================"
echo "  ShipKit - Local Fulfillment Tool"
echo "========================================"
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "[ERROR] Python3 is not installed."
    echo "Please install Python from python.org"
    exit 1
fi

# Install dependencies
echo "[Setup] Installing Python dependencies..."
echo "         This only happens once..."
echo ""

pip3 install -r requirements.txt --quiet
if [ $? -ne 0 ]; then
    echo "[ERROR] Failed to install dependencies."
    echo "Make sure you have internet connection and Python is properly installed."
    exit 1
fi

echo ""
echo "[Starting] ShipKit backend..."
echo ""
echo "Opening http://127.0.0.1:8000 in your browser..."
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start the app
python3 main.py
