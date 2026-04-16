#!/usr/bin/env python3
"""
ShipKit Desktop App
Launches FastAPI backend + PyWebView frontend
"""

import sys
import subprocess
import time
import threading
from pathlib import Path
import webview

# Get paths
PROJECT_ROOT = Path(__file__).parent
BACKEND_DIR = PROJECT_ROOT / "backend"
FRONTEND_BUILD = PROJECT_ROOT / "frontend" / "build"

def start_backend():
    """Start FastAPI server in background"""
    try:
        # Add backend to path
        sys.path.insert(0, str(BACKEND_DIR))
        
        # Import and run uvicorn
        import uvicorn
        from api import app
        
        print("[ShipKit] Starting FastAPI backend on http://127.0.0.1:8000")
        uvicorn.run(
            app,
            host="127.0.0.1",
            port=8000,
            log_level="critical",
            access_log=False
        )
    except Exception as e:
        print(f"[ShipKit ERROR] Failed to start backend: {e}")
        sys.exit(1)

def start_app():
    """Start PyWebView frontend"""
    time.sleep(1)  # Wait for backend to start
    
    try:
        # Check if frontend build exists
        if not FRONTEND_BUILD.exists():
            print("[ShipKit ERROR] Frontend build not found. Please run 'npm run build'")
            sys.exit(1)
        
        # Serve frontend from http://127.0.0.1:8000
        webview.create_window(
            title="ShipKit - Fulfillment Operations",
            url="http://127.0.0.1:8000/index.html",
            width=1400,
            height=900,
            min_size=(1200, 700),
            resizable=True,
            fullscreen=False
        )
        webview.start(debug=False)
    except Exception as e:
        print(f"[ShipKit ERROR] Failed to start frontend: {e}")
        sys.exit(1)

if __name__ == "__main__":
    print("""
    ╔════════════════════════════════════════╗
    ║  ShipKit - Fulfillment Operations      ║
    ║  Starting local desktop application... ║
    ╚════════════════════════════════════════╝
    """)
    
    # Start backend in background thread
    backend_thread = threading.Thread(target=start_backend, daemon=True)
    backend_thread.start()
    
    # Start frontend in main thread
    start_app()
