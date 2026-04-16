from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import uuid
import sqlite3
from datetime import datetime, timedelta
import json
import re
from pathlib import Path

from database import get_db, init_db, seed_catalog
from file_manager import save_upload, get_batch_folder, list_uploads_by_date, delete_batch, get_upload_path

app = FastAPI()

# CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database on startup
@app.on_event("startup")
async def startup():
    init_db()
    seed_catalog()

# ============ Models ============

class Settings(BaseModel):
    storeName: Optional[str] = "My Store"
    primaryZoneName: Optional[str] = "Manifest"
    secondaryZoneName: Optional[str] = "Clerk Counter"
    carrierCloseWeekday: Optional[str] = "17:00"
    carrierCloseSaturday: Optional[str] = "14:00"
    carrierCloseSunday: Optional[str] = None
    travelTimeMinutes: Optional[int] = 15
    lowStockThreshold: Optional[int] = 5
    restockTargetDays: Optional[int] = 14
    printerFormat: Optional[str] = "thermal_4x6"
    audioMode: Optional[str] = "tones"
    voiceId: Optional[str] = None
    audioVolume: Optional[int] = 80
    audioMuted: Optional[bool] = False
    setupComplete: Optional[bool] = False
    surgeThreshold: Optional[int] = 40

class ScanRequest(BaseModel):
    batchId: str
    trackingNumber: str
    variantName: Optional[str] = None

class CommitRequest(BaseModel):
    batchId: str

# ============ Settings Routes ============

@app.get("/api/settings")
async def get_settings():
    """Get user settings"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM settings LIMIT 1")
        row = cursor.fetchone()
        conn.close()
        
        if row:
            return dict(row)
        raise HTTPException(status_code=404, detail="Settings not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.put("/api/settings")
async def update_settings(settings: Settings):
    """Update user settings"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute("SELECT id FROM settings LIMIT 1")
        existing = cursor.fetchone()
        settings_id = existing[0] if existing else str(uuid.uuid4())
        
        if existing:
            cursor.execute("""
                UPDATE settings SET 
                store_name = ?, primary_zone_name = ?, secondary_zone_name = ?,
                carrier_close_weekday = ?, carrier_close_saturday = ?, carrier_close_sunday = ?,
                travel_time_minutes = ?, low_stock_threshold = ?, restock_target_days = ?,
                printer_format = ?, audio_mode = ?, voice_id = ?, audio_volume = ?,
                audio_muted = ?, setup_complete = ?, surge_threshold = ?, updated_at = ?
                WHERE id = ?
            """, (
                settings.storeName, settings.primaryZoneName, settings.secondaryZoneName,
                settings.carrierCloseWeekday, settings.carrierCloseSaturday, settings.carrierCloseSunday,
                settings.travelTimeMinutes, settings.lowStockThreshold, settings.restockTargetDays,
                settings.printerFormat, settings.audioMode, settings.voiceId, settings.audioVolume,
                settings.audioMuted, settings.setupComplete, settings.surgeThreshold,
                datetime.now().isoformat(), settings_id
            ))
        else:
            cursor.execute("""
                INSERT INTO settings 
                (id, store_name, primary_zone_name, secondary_zone_name, carrier_close_weekday,
                 carrier_close_saturday, carrier_close_sunday, travel_time_minutes, low_stock_threshold,
                 restock_target_days, printer_format, audio_mode, voice_id, audio_volume, audio_muted,
                 setup_complete, surge_threshold, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                settings_id, settings.storeName, settings.primaryZoneName, settings.secondaryZoneName,
                settings.carrierCloseWeekday, settings.carrierCloseSaturday, settings.carrierCloseSunday,
                settings.travelTimeMinutes, settings.lowStockThreshold, settings.restockTargetDays,
                settings.printerFormat, settings.audioMode, settings.voiceId, settings.audioVolume,
                settings.audioMuted, settings.setupComplete, settings.surgeThreshold,
                datetime.now().isoformat(), datetime.now().isoformat()
            ))
        
        conn.commit()
        conn.close()
        
        return {"success": True, "message": "Settings saved"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving settings: {str(e)}")

# ============ Catalog Routes ============

@app.get("/api/catalog")
async def get_catalog():
    """Get colors and pack types"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute("SELECT id, name, display_order FROM colors ORDER BY display_order")
        colors = [dict(row) for row in cursor.fetchall()]
        
        cursor.execute("SELECT id, name, display_order FROM pack_types ORDER BY display_order")
        pack_types = [dict(row) for row in cursor.fetchall()]
        
        conn.close()
        return {"colors": colors, "packTypes": pack_types}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching catalog: {str(e)}")

# ============ Inventory Routes ============

@app.get("/api/inventory")
async def get_inventory():
    """Get all inventory items"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT i.id, c.name as color, p.name as packType, i.stock_count
            FROM inventory i
            JOIN colors c ON i.color_id = c.id
            JOIN pack_types p ON i.pack_type_id = p.id
            ORDER BY c.display_order, p.display_order
        """)
        
        inventory = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return inventory
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching inventory: {str(e)}")

@app.put("/api/inventory/{inventory_id}")
async def update_inventory(inventory_id: str, stock_count: int):
    """Update inventory stock"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute(
            "UPDATE inventory SET stock_count = ?, updated_at = ? WHERE id = ?",
            (stock_count, datetime.now().isoformat(), inventory_id)
        )
        
        conn.commit()
        conn.close()
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating inventory: {str(e)}")

# ============ Batch Routes ============

@app.post("/api/batch/create")
async def create_batch():
    """Create a new batch"""
    try:
        batch_id = str(uuid.uuid4())
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute(
            "INSERT INTO batches (id, started_at, status, created_at) VALUES (?, ?, ?, ?)",
            (batch_id, datetime.now().isoformat(), 'active', datetime.now().isoformat())
        )
        
        conn.commit()
        conn.close()
        
        return {"batchId": batch_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating batch: {str(e)}")

@app.get("/api/batch/active")
async def get_active_batch():
    """Get the current active batch"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute("SELECT id FROM batches WHERE status = 'active' ORDER BY created_at DESC LIMIT 1")
        row = cursor.fetchone()
        conn.close()
        
        if row:
            return {"batchId": row[0]}
        return {"batchId": None}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching batch: {str(e)}")

# ============ File Upload Routes ============

@app.post("/api/batch/files/upload")
async def upload_files(batchId: str, files: List[UploadFile] = File(...)):
    """Upload files to batch"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        uploaded = []
        
        for file in files:
            file_data = await file.read()
            file_ext = Path(file.filename).suffix.lower()
            
            # Determine file type
            if 'label' in file.filename.lower() or file_ext == '.pdf':
                file_type = 'label_pdf'
            elif 'manifest' in file.filename.lower() or file_ext == '.csv':
                file_type = 'manifest_csv'
            else:
                file_type = 'usps_slip'
            
            # Save to filesystem
            file_path = save_upload(batchId, file.filename, file_data)
            
            # Store in database
            file_id = str(uuid.uuid4())
            cursor.execute("""
                INSERT INTO uploaded_files (id, batch_id, filename, file_type, file_path, uploaded_at)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (file_id, batchId, file.filename, file_type, str(file_path), datetime.now().isoformat()))
            
            uploaded.append({
                "fileId": file_id,
                "filename": file.filename,
                "fileType": file_type,
                "filePath": str(file_path)
            })
        
        conn.commit()
        conn.close()
        
        return {"uploaded": uploaded, "count": len(uploaded)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error uploading files: {str(e)}")

@app.get("/api/batch/{batch_id}/files")
async def get_batch_files(batch_id: str):
    """Get files for a batch"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute(
            "SELECT id, filename, file_type, file_path FROM uploaded_files WHERE batch_id = ?",
            (batch_id,)
        )
        
        files = [dict(row) for row in cursor.fetchall()]
        conn.close()
        
        return files
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching files: {str(e)}")

# ============ Scan Routes ============

@app.post("/api/batch/scan")
async def scan_package(request: ScanRequest):
    """Record a scanned package"""
    try:
        # Normalize tracking (remove USPS ZIP routing prefix)
        normalized = re.sub(r'^420\d{5}', '', request.trackingNumber)
        
        conn = get_db()
        cursor = conn.cursor()
        
        # Check if tracking is in any manifest CSV
        cursor.execute("""
            SELECT manifest_zone_index FROM csv_orders 
            WHERE batch_id = ? AND normalized_tracking = ?
        """, (request.batchId, normalized))
        
        zone_result = cursor.fetchone()
        zone_type = 'manifest' if zone_result else 'clerk'
        manifest_zone_index = zone_result[0] if zone_result else None
        
        # Record scan
        scan_id = str(uuid.uuid4())
        cursor.execute("""
            INSERT INTO scans (id, batch_id, tracking_number, normalized_tracking, variant_name, 
                              zone_type, manifest_zone_index, scanned_at, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (scan_id, request.batchId, request.trackingNumber, normalized, request.variantName,
              zone_type, manifest_zone_index, datetime.now().isoformat(), datetime.now().isoformat()))
        
        conn.commit()
        conn.close()
        
        return {"scanned": True, "zoneType": zone_type, "zoneIndex": manifest_zone_index}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error scanning: {str(e)}")

# ============ Health Check ============

@app.get("/health")
async def health():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
