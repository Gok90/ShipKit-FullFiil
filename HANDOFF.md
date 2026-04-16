# ShipKit - Session Handoff Document

## Overview

ShipKit is a local-first fulfillment operations tool for TikTok Shop sellers. The UI is built as a standalone HTML file that will be served by a Python/FastAPI backend and displayed in a native desktop window via PyWebView.

---

## Current State

### Completed
- **Standalone HTML UI** at `/frontend/shipkit.html` (2300+ lines)
- **7-tab navigation**: SCAN, PICK LIST, INVENTORY, HISTORY, ANALYTICS, REORDER, FINANCE
- **6-step workflow** on SCAN tab: File Vault, Upload, Print Labels, Pick List, Scan Packages, Print Slips, Ship & Archive
- **Purple/teal dark theme** with CSS variables
- **localStorage state management** with `pg_` prefixed keys
- **Toast notifications** (no native alerts)
- **Modal dialog system**
- **Recent UI additions**:
  - Works Offline badge in nav
  - Daily progress counter
  - SLA badge on CSV pill
  - Settings modal with printer type + zone names
  - Packing photo reminder in Ship confirm
  - Celebration overlay on batch ship
  - Batch cards with carrier accepted timestamp + print carrier card buttons

### Not Yet Built
- Python/FastAPI backend
- PyWebView native window wrapper
- Actual file system operations
- Database persistence (currently all localStorage)

---

## Python Folder Structure

```
ShipKit/
├── main.py                 # Entry point - starts FastAPI + PyWebView
├── requirements.txt        # Python dependencies
├── run.bat                 # Windows launcher
├── run.sh                  # Mac/Linux launcher
│
├── backend/
│   ├── __init__.py
│   ├── api.py              # FastAPI routes
│   ├── database.py         # SQLite operations
│   ├── file_manager.py     # File upload/download handlers
│   └── models.py           # Pydantic models
│
├── frontend/
│   └── shipkit.html        # Complete standalone UI
│
├── data/
│   └── shipkit.db          # SQLite database
│
└── uploads/                # File storage root (see below)
```

---

## Local File Storage - Batch Indexing by Date

### Core Principle
All uploaded files are stored in date-indexed folders. This allows:
- Easy manual browsing of past batches
- Simple backup (just copy the uploads folder)
- Automatic cleanup of old batches
- Quick lookup by date for History tab

### Folder Structure

```
uploads/
├── 2024-01-15/
│   ├── batch_001/
│   │   ├── labels/
│   │   │   ├── label_1.pdf
│   │   │   └── label_2.pdf
│   │   ├── manifests/
│   │   │   └── manifest.csv
│   │   ├── slips/
│   │   │   └── usps_slip.pdf
│   │   └── batch_meta.json
│   │
│   └── batch_002/
│       ├── labels/
│       ├── manifests/
│       ├── slips/
│       └── batch_meta.json
│
├── 2024-01-16/
│   └── batch_001/
│       └── ...
│
└── index.json              # Master index of all batches
```

### batch_meta.json Schema

```json
{
  "id": "batch_001",
  "date": "2024-01-15",
  "createdAt": "2024-01-15T09:30:00Z",
  "shippedAt": "2024-01-15T14:45:00Z",
  "carrierAcceptedAt": "2024-01-15T15:00:00Z",
  "status": "shipped",
  "files": {
    "labels": ["label_1.pdf", "label_2.pdf"],
    "manifests": ["manifest.csv"],
    "slips": ["usps_slip.pdf"]
  },
  "stats": {
    "totalOrders": 37,
    "scanned": 37,
    "zone1Count": 32,
    "zone2Count": 5,
    "variants": {
      "Black 2pk": 12,
      "White 4pk": 8,
      "Blue 2pk": 17
    }
  },
  "printStatus": {
    "labels": ["label_1.pdf"],
    "slips": []
  }
}
```

### index.json Schema (Master Index)

```json
{
  "version": 1,
  "lastUpdated": "2024-01-16T10:00:00Z",
  "batches": [
    {
      "id": "batch_001",
      "date": "2024-01-15",
      "path": "2024-01-15/batch_001",
      "status": "shipped",
      "orderCount": 37,
      "shippedAt": "2024-01-15T14:45:00Z"
    },
    {
      "id": "batch_002",
      "date": "2024-01-15",
      "path": "2024-01-15/batch_002",
      "status": "shipped",
      "orderCount": 24,
      "shippedAt": "2024-01-15T16:30:00Z"
    }
  ]
}
```

### File Manager Operations

```python
# file_manager.py - Key Functions

def get_today_folder() -> Path:
    """Returns uploads/YYYY-MM-DD, creates if needed"""
    today = datetime.now().strftime("%Y-%m-%d")
    folder = UPLOADS_ROOT / today
    folder.mkdir(parents=True, exist_ok=True)
    return folder

def create_batch(date_folder: Path) -> str:
    """Creates new batch_XXX folder, returns batch_id"""
    existing = [d for d in date_folder.iterdir() if d.is_dir() and d.name.startswith("batch_")]
    next_num = len(existing) + 1
    batch_id = f"batch_{next_num:03d}"
    batch_folder = date_folder / batch_id
    (batch_folder / "labels").mkdir(parents=True)
    (batch_folder / "manifests").mkdir()
    (batch_folder / "slips").mkdir()
    # Initialize batch_meta.json
    write_batch_meta(batch_folder, {"id": batch_id, "date": date_folder.name, ...})
    return batch_id

def save_upload(batch_id: str, file_type: str, file: UploadFile) -> str:
    """Saves file to correct subfolder, returns relative path"""
    # file_type: "labels" | "manifests" | "slips"
    batch_folder = find_batch_folder(batch_id)
    dest = batch_folder / file_type / file.filename
    with open(dest, "wb") as f:
        f.write(file.file.read())
    update_batch_meta(batch_folder, file_type, file.filename)
    return str(dest.relative_to(UPLOADS_ROOT))

def list_batches_by_date(date: str) -> List[dict]:
    """Returns all batches for a given date"""
    date_folder = UPLOADS_ROOT / date
    if not date_folder.exists():
        return []
    batches = []
    for batch_folder in sorted(date_folder.iterdir()):
        if batch_folder.is_dir():
            meta = read_batch_meta(batch_folder)
            batches.append(meta)
    return batches

def get_batch_files(batch_id: str) -> dict:
    """Returns all files in a batch organized by type"""
    batch_folder = find_batch_folder(batch_id)
    return {
        "labels": list((batch_folder / "labels").glob("*")),
        "manifests": list((batch_folder / "manifests").glob("*")),
        "slips": list((batch_folder / "slips").glob("*"))
    }
```

---

## API Endpoints (FastAPI)

```python
# api.py - Route Summary

# ── Settings ──
GET  /api/settings              # Get current settings
PUT  /api/settings              # Update settings

# ── Batch Operations ──
POST /api/batch/create          # Create new batch for today
GET  /api/batch/{id}            # Get batch metadata
PUT  /api/batch/{id}            # Update batch (status, timestamps)
DELETE /api/batch/{id}          # Delete batch and files

# ── File Operations ──
POST /api/batch/{id}/upload     # Upload files (labels/manifests/slips)
GET  /api/batch/{id}/files      # List all files in batch
GET  /api/batch/{id}/file/{name} # Download specific file
DELETE /api/batch/{id}/file/{name} # Delete specific file

# ── Scanning ──
POST /api/batch/{id}/scan       # Record a scan (tracking number)
GET  /api/batch/{id}/scans      # Get all scans for batch

# ── History ──
GET  /api/history               # List all shipped batches
GET  /api/history/{date}        # List batches for specific date

# ── Inventory ──
GET  /api/inventory             # Get all inventory items
PUT  /api/inventory/{id}        # Update stock count

# ── File Vault ──
GET  /api/vault                 # List all dates with batches
GET  /api/vault/{date}          # List batches for date (for drag into upload)
```

---

## main.py Entry Point

```python
#!/usr/bin/env python3
"""
ShipKit Desktop App
Serves FastAPI backend + PyWebView native window
"""

import sys
import threading
from pathlib import Path

PROJECT_ROOT = Path(__file__).parent
sys.path.insert(0, str(PROJECT_ROOT / "backend"))

def start_backend():
    import uvicorn
    from api import app
    from database import init_db
    
    init_db()
    uvicorn.run(app, host="127.0.0.1", port=8000, log_level="warning")

def start_window():
    import webview
    import time
    time.sleep(1)  # Wait for backend
    
    webview.create_window(
        title='ShipKit - Fulfillment Operations',
        url='http://127.0.0.1:8000',
        width=1400,
        height=900,
        min_size=(1000, 600),
        background_color='#0f0a1a'
    )
    webview.start()

if __name__ == "__main__":
    # Create folders
    (PROJECT_ROOT / "data").mkdir(exist_ok=True)
    (PROJECT_ROOT / "uploads").mkdir(exist_ok=True)
    
    # Start backend thread
    backend = threading.Thread(target=start_backend, daemon=True)
    backend.start()
    
    # Start native window (blocking)
    start_window()
```

---

## requirements.txt

```
fastapi==0.115.0
uvicorn==0.30.0
python-multipart==0.0.9
pydantic==2.8.0
aiosqlite==0.20.0
pywebview==5.1
```

---

## Database Schema (SQLite)

```sql
-- data/shipkit.db

CREATE TABLE settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

CREATE TABLE inventory (
    id TEXT PRIMARY KEY,
    color TEXT NOT NULL,
    pack_type TEXT NOT NULL,
    stock_count INTEGER DEFAULT 0,
    low_stock_threshold INTEGER DEFAULT 5,
    updated_at TEXT
);

CREATE TABLE scans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    batch_id TEXT NOT NULL,
    tracking_number TEXT NOT NULL,
    zone_type TEXT,  -- 'manifest' or 'clerk'
    zone_index INTEGER,
    scanned_at TEXT NOT NULL
);

CREATE TABLE analytics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    batch_count INTEGER,
    order_count INTEGER,
    recorded_at TEXT
);
```

---

## UI-Backend Communication

The HTML UI communicates with the Python backend via fetch() calls. The API layer in the HTML file wraps these:

```javascript
// In shipkit.html
const API = {
  async createBatch() {
    const res = await fetch('/api/batch/create', { method: 'POST' });
    return res.json();
  },
  
  async uploadFiles(batchId, files) {
    const formData = new FormData();
    files.forEach(f => formData.append('files', f));
    const res = await fetch(`/api/batch/${batchId}/upload`, {
      method: 'POST',
      body: formData
    });
    return res.json();
  },
  
  async recordScan(batchId, tracking) {
    const res = await fetch(`/api/batch/${batchId}/scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trackingNumber: tracking })
    });
    return res.json();
  }
  // ... etc
};
```

---

## Next Steps

1. **Build Python Backend**
   - Copy the folder structure above
   - Implement FastAPI routes in `api.py`
   - Implement file operations in `file_manager.py`
   - Set up SQLite in `database.py`

2. **Wire UI to Backend**
   - Replace localStorage calls with API fetch calls
   - Update File Vault to load from `/api/vault`
   - Update Upload to POST to `/api/batch/{id}/upload`

3. **Test PyWebView**
   - Verify native window opens correctly
   - Test file dialog integration if needed
   - Handle window close gracefully

4. **Package for Distribution**
   - Create installer with PyInstaller
   - Bundle all dependencies
   - Create desktop shortcut

---

## Key Files to Reference

| File | Purpose |
|------|---------|
| `/frontend/shipkit.html` | Complete standalone UI |
| `/HANDOFF.md` | This document |
| `user_read_only_context/text_attachments/ShipKit_AI_Strategy_Guide_v3-*.md` | Architecture decisions |
| `user_read_only_context/text_attachments/ship-kit--v0-ui-build-prompt-*.md` | UI specifications |

---

*Last Updated: Session ended with UI complete, Python backend scaffolding documented but not yet implemented.*
