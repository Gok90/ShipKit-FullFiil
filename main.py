#!/usr/bin/env python3
"""
ShipKit Desktop App - Native Window
Uses PyWebView for native desktop window + FastAPI backend
"""

import sys
import threading
import time
from pathlib import Path

# Get paths
PROJECT_ROOT = Path(__file__).parent
BACKEND_DIR = PROJECT_ROOT / "backend"

# Add backend to path
sys.path.insert(0, str(BACKEND_DIR))

def start_backend():
    """Start FastAPI backend in background thread"""
    try:
        import uvicorn
        from api import app
        from database import init_db
        
        # Initialize database
        init_db()
        
        # Start server silently
        uvicorn.run(
            app,
            host="127.0.0.1",
            port=8000,
            log_level="critical"
        )
    except Exception as e:
        print(f"[ERROR] Backend failed: {e}")
        import traceback
        traceback.print_exc()

def start_desktop_app():
    """Start PyWebView native window"""
    try:
        import webview
        
        # Wait for backend to start
        time.sleep(1)
        
        # Create native window
        window = webview.create_window(
            title='ShipKit - Fulfillment Operations',
            url='http://127.0.0.1:8000',
            width=1400,
            height=900,
            min_size=(1000, 600),
            resizable=True,
            background_color='#0f1218'
        )
        
        # Show window and run
        webview.start()
        
    except Exception as e:
        print(f"[ERROR] Failed to create window: {e}")
        import traceback
        traceback.print_exc()
        input("\nPress Enter to exit...")

if __name__ == "__main__":
    print("""
    ========================================
      ShipKit - Native Desktop App
      Starting...
    ========================================
    """)
    
    # Create required folders
    (PROJECT_ROOT / "data").mkdir(exist_ok=True)
    (PROJECT_ROOT / "uploads").mkdir(exist_ok=True)
    
    # Start backend in background thread
    backend_thread = threading.Thread(target=start_backend, daemon=True)
    backend_thread.start()
    
    # Start desktop window (blocks until closed)
    start_desktop_app()
    
    print("\nShipKit closed. Goodbye!")
