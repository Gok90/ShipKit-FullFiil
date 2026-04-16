#!/usr/bin/env python3
"""
ShipKit Desktop App
Launches FastAPI backend with browser-based UI
No Node.js, React, or complex dependencies required
"""

import sys
import webbrowser
import time
from pathlib import Path

# Get paths
PROJECT_ROOT = Path(__file__).parent
BACKEND_DIR = PROJECT_ROOT / "backend"

# Add backend to path before imports
sys.path.insert(0, str(BACKEND_DIR))

def start_app():
    """Start FastAPI server and open browser"""
    try:
        import uvicorn
        from api import app
        from database import init_db
        
        # Initialize database
        print("[ShipKit] Initializing database...")
        init_db()
        
        print("""
    ========================================
      ShipKit - Local Fulfillment Tool
    ========================================
    """)
        print("[ShipKit] Opening http://127.0.0.1:8000 in browser...")
        
        # Open browser
        try:
            webbrowser.open("http://127.0.0.1:8000")
        except:
            print("[ShipKit] Could not open browser automatically.")
            print("[ShipKit] Please open http://127.0.0.1:8000 manually.")
        
        print("[ShipKit] Backend running. Press Ctrl+C to stop.\n")
        
        # Start server
        uvicorn.run(
            app,
            host="127.0.0.1",
            port=8000,
            log_level="info"
        )
        
    except Exception as e:
        print(f"\n[ShipKit ERROR] Failed to start: {e}")
        import traceback
        traceback.print_exc()
        print("\nTroubleshooting:")
        print("1. Make sure Python 3.8+ is installed")
        print("2. Run: pip install fastapi uvicorn aiosqlite python-multipart pydantic")
        print("3. Check that you're in the ShipKit folder")
        input("\nPress Enter to exit...")

if __name__ == "__main__":
    # Create required folders
    (PROJECT_ROOT / "data").mkdir(exist_ok=True)
    (PROJECT_ROOT / "uploads").mkdir(exist_ok=True)
    
    # Start app
    start_app()
