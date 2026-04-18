from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, HTMLResponse
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
from shipkit_ui import get_complete_ui

app = FastAPI()

# ============ Serve HTML UI ============
@app.get("/", response_class=HTMLResponse)
async def serve_ui():
    """Serve the complete ShipKit application UI"""
    return get_complete_ui()

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

def get_html_ui():
    """Return the complete HTML UI"""
    return '''
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ShipKit - Fulfillment Operations</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            darkMode: 'class',
            theme: {
                extend: {
                    colors: {
                        primary: '#3fc5e7',
                        secondary: '#7122c6',
                    }
                }
            }
        }
    </script>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
        .toast { animation: slideIn 0.3s ease; }
        @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
        .tab-active { border-bottom: 2px solid #3fc5e7; color: #3fc5e7; }
    </style>
</head>
<body class="dark bg-gray-900 text-white min-h-screen">
    <div id="app">
        <!-- Header -->
        <header class="bg-gray-800 border-b border-gray-700 px-6 py-4">
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-[#3fc5e7] to-[#7122c6] flex items-center justify-center font-bold text-lg">
                        SK
                    </div>
                    <div>
                        <h1 class="text-xl font-bold" id="storeName">ShipKit</h1>
                        <p class="text-sm text-gray-400">Local Fulfillment Tool</p>
                    </div>
                </div>
                <button onclick="openSettings()" class="p-2 rounded-lg hover:bg-gray-700">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                    </svg>
                </button>
            </div>
        </header>
        
        <!-- Tabs -->
        <nav class="bg-gray-800 border-b border-gray-700 px-6">
            <div class="flex gap-6">
                <button onclick="switchTab('scan')" class="py-3 px-1 text-sm font-medium tab-btn tab-active" data-tab="scan">
                    Scan
                </button>
                <button onclick="switchTab('inventory')" class="py-3 px-1 text-sm font-medium tab-btn text-gray-400 hover:text-white" data-tab="inventory">
                    Inventory
                </button>
                <button onclick="switchTab('history')" class="py-3 px-1 text-sm font-medium tab-btn text-gray-400 hover:text-white" data-tab="history">
                    History
                </button>
            </div>
        </nav>
        
        <!-- Main Content -->
        <main class="p-6">
            <!-- Scan Tab -->
            <div id="tab-scan" class="tab-content">
                <!-- Step 1: Upload -->
                <div class="bg-gray-800 rounded-lg p-6 mb-4">
                    <div class="flex items-center gap-3 mb-4">
                        <span class="w-8 h-8 rounded-full bg-primary text-gray-900 flex items-center justify-center font-bold">1</span>
                        <h2 class="text-lg font-semibold">Upload Files</h2>
                    </div>
                    <div id="dropzone" class="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer">
                        <input type="file" id="fileInput" multiple accept=".pdf,.csv" class="hidden" onchange="handleFileUpload(event)">
                        <svg class="w-12 h-12 mx-auto mb-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                        </svg>
                        <p class="text-gray-400 mb-2">Drop label PDFs, manifest CSVs, and USPS slips here</p>
                        <p class="text-sm text-gray-500">or click to browse</p>
                    </div>
                    <div id="uploadedFiles" class="mt-4 space-y-2"></div>
                </div>
                
                <!-- Step 2: Scan -->
                <div class="bg-gray-800 rounded-lg p-6 mb-4">
                    <div class="flex items-center gap-3 mb-4">
                        <span class="w-8 h-8 rounded-full bg-primary text-gray-900 flex items-center justify-center font-bold">2</span>
                        <h2 class="text-lg font-semibold">Scan Packages</h2>
                    </div>
                    
                    <div class="flex gap-4 mb-6">
                        <button id="armBtn" onclick="toggleScanner()" class="flex-1 py-4 rounded-lg bg-gray-700 hover:bg-gray-600 font-medium text-lg transition-colors">
                            Arm Scanner
                        </button>
                        <input type="text" id="scanInput" class="hidden-input absolute -left-full" onkeydown="handleScan(event)">
                    </div>
                    
                    <!-- Zone Cards -->
                    <div id="zoneCards" class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div class="text-center py-8 text-gray-500">
                            Upload a manifest CSV to create zones
                        </div>
                    </div>
                    
                    <!-- Scan Log -->
                    <div class="border border-gray-700 rounded-lg">
                        <div class="px-4 py-3 border-b border-gray-700 flex justify-between items-center">
                            <span class="font-medium">Scan Log</span>
                            <span id="scanCount" class="text-sm text-gray-400">0 scanned</span>
                        </div>
                        <div id="scanLog" class="max-h-48 overflow-y-auto p-4 space-y-2">
                            <p class="text-gray-500 text-center">Scans will appear here</p>
                        </div>
                    </div>
                </div>
                
                <!-- Step 3: Ship -->
                <div class="bg-gray-800 rounded-lg p-6">
                    <div class="flex items-center gap-3 mb-4">
                        <span class="w-8 h-8 rounded-full bg-primary text-gray-900 flex items-center justify-center font-bold">3</span>
                        <h2 class="text-lg font-semibold">Ship & Archive</h2>
                    </div>
                    <button id="shipBtn" onclick="shipAndSave()" disabled class="w-full py-4 rounded-lg bg-gray-600 text-gray-400 font-medium text-lg cursor-not-allowed">
                        Ship & Save
                    </button>
                </div>
            </div>
            
            <!-- Inventory Tab -->
            <div id="tab-inventory" class="tab-content hidden">
                <div class="bg-gray-800 rounded-lg p-6">
                    <div class="flex justify-between items-center mb-6">
                        <h2 class="text-lg font-semibold">Inventory</h2>
                        <div class="text-sm text-gray-400">
                            <span id="totalUnits">0</span> units in stock
                        </div>
                    </div>
                    <div id="inventoryGrid" class="space-y-4">
                        <p class="text-gray-500 text-center py-8">Loading inventory...</p>
                    </div>
                </div>
            </div>
            
            <!-- History Tab -->
            <div id="tab-history" class="tab-content hidden">
                <div class="bg-gray-800 rounded-lg p-6">
                    <h2 class="text-lg font-semibold mb-6">Shipping History</h2>
                    <div id="historyList" class="space-y-4">
                        <p class="text-gray-500 text-center py-8">No shipping history yet</p>
                    </div>
                </div>
            </div>
        </main>
        
        <!-- Toast Container -->
        <div id="toastContainer" class="fixed top-4 right-4 space-y-2 z-50"></div>
        
        <!-- Setup Wizard Modal -->
        <div id="setupModal" class="fixed inset-0 bg-black/80 flex items-center justify-center z-50 hidden">
            <div class="bg-gray-800 rounded-xl p-8 max-w-md w-full mx-4">
                <h2 class="text-2xl font-bold mb-2">Welcome to ShipKit</h2>
                <p class="text-gray-400 mb-6">Let's get you set up in just a moment.</p>
                
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium mb-2">Store Name</label>
                        <input type="text" id="setupStoreName" class="w-full px-4 py-3 bg-gray-700 rounded-lg border border-gray-600 focus:border-primary focus:outline-none" placeholder="My TikTok Shop">
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium mb-2">Manifest Zone Name</label>
                            <input type="text" id="setupPrimaryZone" value="Manifest" class="w-full px-4 py-3 bg-gray-700 rounded-lg border border-gray-600 focus:border-primary focus:outline-none">
                        </div>
                        <div>
                            <label class="block text-sm font-medium mb-2">Clerk Zone Name</label>
                            <input type="text" id="setupSecondaryZone" value="Clerk Counter" class="w-full px-4 py-3 bg-gray-700 rounded-lg border border-gray-600 focus:border-primary focus:outline-none">
                        </div>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium mb-2">Carrier Close Time (Weekday)</label>
                        <input type="time" id="setupCarrierTime" value="17:00" class="w-full px-4 py-3 bg-gray-700 rounded-lg border border-gray-600 focus:border-primary focus:outline-none">
                    </div>
                </div>
                
                <div id="setupError" class="hidden mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm"></div>
                
                <button onclick="completeSetup()" class="w-full mt-6 py-4 rounded-lg bg-gradient-to-r from-[#3fc5e7] to-[#7122c6] font-semibold text-lg hover:opacity-90 transition-opacity">
                    Start Using ShipKit
                </button>
            </div>
        </div>
        
        <!-- Settings Modal -->
        <div id="settingsModal" class="fixed inset-0 bg-black/80 flex items-center justify-center z-50 hidden">
            <div class="bg-gray-800 rounded-xl p-8 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-xl font-bold">Settings</h2>
                    <button onclick="closeSettings()" class="p-2 hover:bg-gray-700 rounded-lg">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
                
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium mb-2">Store Name</label>
                        <input type="text" id="settingsStoreName" class="w-full px-4 py-3 bg-gray-700 rounded-lg border border-gray-600 focus:border-primary focus:outline-none">
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium mb-2">Primary Zone Name</label>
                            <input type="text" id="settingsPrimaryZone" class="w-full px-4 py-3 bg-gray-700 rounded-lg border border-gray-600 focus:border-primary focus:outline-none">
                        </div>
                        <div>
                            <label class="block text-sm font-medium mb-2">Secondary Zone Name</label>
                            <input type="text" id="settingsSecondaryZone" class="w-full px-4 py-3 bg-gray-700 rounded-lg border border-gray-600 focus:border-primary focus:outline-none">
                        </div>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium mb-2">Low Stock Threshold</label>
                        <input type="number" id="settingsLowStock" class="w-full px-4 py-3 bg-gray-700 rounded-lg border border-gray-600 focus:border-primary focus:outline-none">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium mb-2">Audio Mode</label>
                        <select id="settingsAudioMode" class="w-full px-4 py-3 bg-gray-700 rounded-lg border border-gray-600 focus:border-primary focus:outline-none">
                            <option value="tones">Tones</option>
                            <option value="voice">Voice</option>
                        </select>
                    </div>
                </div>
                
                <button onclick="saveSettings()" class="w-full mt-6 py-3 rounded-lg bg-primary text-gray-900 font-semibold hover:opacity-90 transition-opacity">
                    Save Settings
                </button>
            </div>
        </div>
    </div>
    
    <script>
        // State
        let currentTab = 'scan';
        let settings = {};
        let batchId = null;
        let scans = [];
        let isArmed = false;
        let inventory = [];
        
        // Audio
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const ZONE_TONES = {
            1: 523.25, // C5
            2: 587.33, // D5
            3: 659.25, // E5
            4: 698.46, // F5
            clerk: 261.63 // C4 (lower)
        };
        
        function playTone(zoneIndex) {
            const freq = zoneIndex === 'clerk' ? ZONE_TONES.clerk : (ZONE_TONES[zoneIndex] || 523.25);
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.frequency.value = freq;
            osc.type = 'sine';
            gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.3);
        }
        
        // Toast notifications
        function showToast(message, type = 'info') {
            const container = document.getElementById('toastContainer');
            const colors = {
                success: 'bg-green-600',
                error: 'bg-red-600',
                info: 'bg-blue-600',
                warning: 'bg-yellow-600'
            };
            
            const toast = document.createElement('div');
            toast.className = `toast px-4 py-3 rounded-lg ${colors[type]} text-white shadow-lg`;
            toast.textContent = message;
            container.appendChild(toast);
            
            setTimeout(() => {
                toast.style.opacity = '0';
                setTimeout(() => toast.remove(), 300);
            }, 4000);
        }
        
        // Tab switching
        function switchTab(tab) {
            currentTab = tab;
            document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
            document.getElementById('tab-' + tab).classList.remove('hidden');
            document.querySelectorAll('.tab-btn').forEach(btn => {
                btn.classList.remove('tab-active', 'text-white');
                btn.classList.add('text-gray-400');
            });
            document.querySelector(`[data-tab="${tab}"]`).classList.add('tab-active');
            document.querySelector(`[data-tab="${tab}"]`).classList.remove('text-gray-400');
            
            if (tab === 'inventory') loadInventory();
        }
        
        // Load settings
        async function loadSettings() {
            try {
                const res = await fetch('/api/settings');
                if (res.ok) {
                    settings = await res.json();
                    document.getElementById('storeName').textContent = settings.store_name || 'ShipKit';
                    
                    if (!settings.setup_complete) {
                        document.getElementById('setupModal').classList.remove('hidden');
                    }
                }
            } catch (e) {
                console.error('Failed to load settings:', e);
                document.getElementById('setupModal').classList.remove('hidden');
            }
        }
        
        // Complete setup
        async function completeSetup() {
            const storeName = document.getElementById('setupStoreName').value.trim();
            const primaryZone = document.getElementById('setupPrimaryZone').value.trim();
            const secondaryZone = document.getElementById('setupSecondaryZone').value.trim();
            const carrierTime = document.getElementById('setupCarrierTime').value;
            
            if (!storeName) {
                document.getElementById('setupError').textContent = 'Please enter a store name';
                document.getElementById('setupError').classList.remove('hidden');
                return;
            }
            
            try {
                const res = await fetch('/api/settings', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        storeName: storeName,
                        primaryZoneName: primaryZone || 'Manifest',
                        secondaryZoneName: secondaryZone || 'Clerk Counter',
                        carrierCloseWeekday: carrierTime || '17:00',
                        setupComplete: true
                    })
                });
                
                if (res.ok) {
                    document.getElementById('setupModal').classList.add('hidden');
                    document.getElementById('storeName').textContent = storeName;
                    showToast('Setup complete! Welcome to ShipKit.', 'success');
                    settings = await res.json();
                } else {
                    const err = await res.json();
                    document.getElementById('setupError').textContent = err.detail || 'Failed to save settings';
                    document.getElementById('setupError').classList.remove('hidden');
                }
            } catch (e) {
                document.getElementById('setupError').textContent = 'Network error. Please try again.';
                document.getElementById('setupError').classList.remove('hidden');
            }
        }
        
        // Settings modal
        function openSettings() {
            document.getElementById('settingsStoreName').value = settings.store_name || '';
            document.getElementById('settingsPrimaryZone').value = settings.primary_zone_name || 'Manifest';
            document.getElementById('settingsSecondaryZone').value = settings.secondary_zone_name || 'Clerk Counter';
            document.getElementById('settingsLowStock').value = settings.low_stock_threshold || 5;
            document.getElementById('settingsAudioMode').value = settings.audio_mode || 'tones';
            document.getElementById('settingsModal').classList.remove('hidden');
        }
        
        function closeSettings() {
            document.getElementById('settingsModal').classList.add('hidden');
        }
        
        async function saveSettings() {
            try {
                const res = await fetch('/api/settings', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        storeName: document.getElementById('settingsStoreName').value,
                        primaryZoneName: document.getElementById('settingsPrimaryZone').value,
                        secondaryZoneName: document.getElementById('settingsSecondaryZone').value,
                        lowStockThreshold: parseInt(document.getElementById('settingsLowStock').value),
                        audioMode: document.getElementById('settingsAudioMode').value,
                        setupComplete: true
                    })
                });
                
                if (res.ok) {
                    settings = await res.json();
                    document.getElementById('storeName').textContent = settings.store_name;
                    closeSettings();
                    showToast('Settings saved', 'success');
                } else {
                    showToast('Failed to save settings', 'error');
                }
            } catch (e) {
                showToast('Network error', 'error');
            }
        }
        
        // File upload
        document.getElementById('dropzone').addEventListener('click', () => {
            document.getElementById('fileInput').click();
        });
        
        document.getElementById('dropzone').addEventListener('dragover', (e) => {
            e.preventDefault();
            e.currentTarget.classList.add('border-primary');
        });
        
        document.getElementById('dropzone').addEventListener('dragleave', (e) => {
            e.currentTarget.classList.remove('border-primary');
        });
        
        document.getElementById('dropzone').addEventListener('drop', (e) => {
            e.preventDefault();
            e.currentTarget.classList.remove('border-primary');
            handleFileUpload({ target: { files: e.dataTransfer.files } });
        });
        
        async function handleFileUpload(e) {
            const files = Array.from(e.target.files);
            if (!files.length) return;
            
            // Create batch if needed
            if (!batchId) {
                try {
                    const res = await fetch('/api/batch/create', { method: 'POST' });
                    const data = await res.json();
                    batchId = data.batchId;
                } catch (e) {
                    showToast('Failed to create batch', 'error');
                    return;
                }
            }
            
            // Upload files
            const formData = new FormData();
            files.forEach(f => formData.append('files', f));
            
            try {
                const res = await fetch(`/api/batch/files/upload?batchId=${batchId}`, {
                    method: 'POST',
                    body: formData
                });
                
                if (res.ok) {
                    const data = await res.json();
                    showToast(`${data.count} file(s) uploaded`, 'success');
                    updateUploadedFiles(data.uploaded);
                } else {
                    showToast('Upload failed', 'error');
                }
            } catch (e) {
                showToast('Upload error: ' + e.message, 'error');
            }
        }
        
        function updateUploadedFiles(files) {
            const container = document.getElementById('uploadedFiles');
            files.forEach(f => {
                const pill = document.createElement('div');
                pill.className = 'flex items-center gap-2 px-3 py-2 bg-gray-700 rounded-lg';
                pill.innerHTML = `
                    <svg class="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"/>
                    </svg>
                    <span class="text-sm truncate">${f.filename}</span>
                    <span class="text-xs px-2 py-0.5 rounded bg-gray-600">${f.fileType.replace('_', ' ')}</span>
                `;
                container.appendChild(pill);
            });
        }
        
        // Scanner
        function toggleScanner() {
            isArmed = !isArmed;
            const btn = document.getElementById('armBtn');
            const input = document.getElementById('scanInput');
            
            if (isArmed) {
                btn.textContent = 'Scanner Armed';
                btn.classList.remove('bg-gray-700');
                btn.classList.add('bg-red-600', 'animate-pulse');
                input.focus();
            } else {
                btn.textContent = 'Arm Scanner';
                btn.classList.add('bg-gray-700');
                btn.classList.remove('bg-red-600', 'animate-pulse');
            }
        }
        
        async function handleScan(e) {
            if (e.key !== 'Enter') return;
            if (!isArmed) return;
            
            const tracking = e.target.value.trim();
            e.target.value = '';
            
            if (!tracking) return;
            if (!batchId) {
                showToast('Please upload files first', 'warning');
                return;
            }
            
            try {
                const res = await fetch('/api/batch/scan', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ batchId, trackingNumber: tracking })
                });
                
                if (res.ok) {
                    const data = await res.json();
                    scans.push({ tracking, zone: data.zoneType, zoneIndex: data.zoneIndex });
                    
                    // Play tone
                    playTone(data.zoneType === 'clerk' ? 'clerk' : (data.zoneIndex || 1));
                    
                    // Update UI
                    updateScanLog();
                    updateShipButton();
                } else {
                    showToast('Scan failed', 'error');
                }
            } catch (e) {
                showToast('Scan error: ' + e.message, 'error');
            }
        }
        
        function updateScanLog() {
            const log = document.getElementById('scanLog');
            const count = document.getElementById('scanCount');
            count.textContent = `${scans.length} scanned`;
            
            const last5 = scans.slice(-5).reverse();
            log.innerHTML = last5.map(s => `
                <div class="flex justify-between items-center px-3 py-2 bg-gray-700 rounded">
                    <span class="font-mono text-sm">${s.tracking.slice(-8)}</span>
                    <span class="text-xs px-2 py-0.5 rounded ${s.zone === 'clerk' ? 'bg-yellow-600' : 'bg-green-600'}">
                        ${s.zone === 'clerk' ? 'Clerk' : 'Manifest ' + (s.zoneIndex || 1)}
                    </span>
                </div>
            `).join('');
        }
        
        function updateShipButton() {
            const btn = document.getElementById('shipBtn');
            if (scans.length > 0) {
                btn.disabled = false;
                btn.classList.remove('bg-gray-600', 'text-gray-400', 'cursor-not-allowed');
                btn.classList.add('bg-primary', 'text-gray-900', 'hover:opacity-90');
                btn.textContent = `Ship & Save - ${scans.length} packages`;
            }
        }
        
        async function shipAndSave() {
            if (!scans.length) return;
            
            showToast('Batch saved! ' + scans.length + ' packages shipped.', 'success');
            
            // Reset for next batch
            scans = [];
            batchId = null;
            document.getElementById('uploadedFiles').innerHTML = '';
            document.getElementById('scanLog').innerHTML = '<p class="text-gray-500 text-center">Scans will appear here</p>';
            document.getElementById('scanCount').textContent = '0 scanned';
            document.getElementById('shipBtn').disabled = true;
            document.getElementById('shipBtn').textContent = 'Ship & Save';
            document.getElementById('shipBtn').classList.add('bg-gray-600', 'text-gray-400', 'cursor-not-allowed');
            document.getElementById('shipBtn').classList.remove('bg-primary', 'text-gray-900');
        }
        
        // Inventory
        async function loadInventory() {
            try {
                const res = await fetch('/api/inventory');
                if (res.ok) {
                    inventory = await res.json();
                    renderInventory();
                }
            } catch (e) {
                showToast('Failed to load inventory', 'error');
            }
        }
        
        function renderInventory() {
            const grid = document.getElementById('inventoryGrid');
            const total = inventory.reduce((sum, item) => sum + (item.stock_count || 0), 0);
            document.getElementById('totalUnits').textContent = total;
            
            if (!inventory.length) {
                grid.innerHTML = '<p class="text-gray-500 text-center py-8">No inventory items</p>';
                return;
            }
            
            // Group by color
            const grouped = {};
            inventory.forEach(item => {
                if (!grouped[item.color]) grouped[item.color] = [];
                grouped[item.color].push(item);
            });
            
            grid.innerHTML = Object.entries(grouped).map(([color, items]) => `
                <div class="border border-gray-700 rounded-lg p-4">
                    <h3 class="font-semibold mb-3">${color}</h3>
                    <div class="space-y-2">
                        ${items.map(item => `
                            <div class="flex justify-between items-center">
                                <span class="text-sm text-gray-400">${item.packType || item.pack_type}</span>
                                <div class="flex items-center gap-2">
                                    <button onclick="adjustInventory('${item.id}', -1)" class="w-8 h-8 rounded bg-gray-700 hover:bg-gray-600">-</button>
                                    <span class="w-12 text-center font-mono ${(item.stock_count || 0) === 0 ? 'text-red-400' : ''}">${item.stock_count || 0}</span>
                                    <button onclick="adjustInventory('${item.id}', 1)" class="w-8 h-8 rounded bg-gray-700 hover:bg-gray-600">+</button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `).join('');
        }
        
        async function adjustInventory(id, delta) {
            const item = inventory.find(i => i.id === id);
            if (!item) return;
            
            const newCount = Math.max(0, (item.stock_count || 0) + delta);
            
            try {
                const res = await fetch(`/api/inventory/${id}?stock_count=${newCount}`, { method: 'PUT' });
                if (res.ok) {
                    item.stock_count = newCount;
                    renderInventory();
                }
            } catch (e) {
                showToast('Failed to update', 'error');
            }
        }
        
        // Init
        document.addEventListener('DOMContentLoaded', () => {
            loadSettings();
        });
    </script>
</body>
</html>
'''

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
