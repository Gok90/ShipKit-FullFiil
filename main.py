#!/usr/bin/env python3
"""
ShipKit Desktop App
Launches FastAPI backend + PyWebView frontend
No Node.js or React build required - uses built-in HTML UI
"""

import sys
import threading
import time
from pathlib import Path

# Get paths
PROJECT_ROOT = Path(__file__).parent
BACKEND_DIR = PROJECT_ROOT / "backend"

# Add backend to path before imports
sys.path.insert(0, str(BACKEND_DIR))

def start_backend():
    """Start FastAPI server in background"""
    try:
        import uvicorn
        from api import app
        
        print("[ShipKit] Backend starting on http://127.0.0.1:8000")
        uvicorn.run(
            app,
            host="127.0.0.1",
            port=8000,
            log_level="warning"
        )
    except Exception as e:
        print(f"[ShipKit ERROR] Backend failed: {e}")
        import traceback
        traceback.print_exc()

def start_app():
    """Start PyWebView frontend"""
    import webview
    
    # Wait for backend
    time.sleep(1.5)
    
    print("[ShipKit] Opening application window...")
    
    window = webview.create_window(
        title="ShipKit - Fulfillment Operations",
        url="http://127.0.0.1:8000",
        width=1400,
        height=900,
        min_size=(1000, 600),
        resizable=True
    )
    
    webview.start()

if __name__ == "__main__":
    print("""
    ========================================
      ShipKit - Local Fulfillment Tool
      Starting application...
    ========================================
    """)
    
    # Create required folders
    (PROJECT_ROOT / "data").mkdir(exist_ok=True)
    (PROJECT_ROOT / "uploads").mkdir(exist_ok=True)
    
    # Start backend in background thread
    backend_thread = threading.Thread(target=start_backend, daemon=True)
    backend_thread.start()
    
    # Start frontend (blocks until window closed)
    start_app()
    
    print("\n[ShipKit] Application closed. Goodbye!")
