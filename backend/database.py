import sqlite3
import json
from pathlib import Path
from datetime import datetime
from typing import Optional, List, Dict, Any
import uuid

# Database path in data folder
DB_PATH = Path(__file__).parent.parent / "data" / "shipkit.db"
DB_PATH.parent.mkdir(parents=True, exist_ok=True)

def get_db():
    """Get database connection with row factory"""
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initialize database schema"""
    conn = get_db()
    cursor = conn.cursor()
    
    # Settings table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS settings (
            id TEXT PRIMARY KEY,
            store_name TEXT DEFAULT 'My Store',
            primary_zone_name TEXT DEFAULT 'Manifest',
            secondary_zone_name TEXT DEFAULT 'Clerk Counter',
            carrier_close_weekday TEXT DEFAULT '17:00',
            carrier_close_saturday TEXT DEFAULT '14:00',
            carrier_close_sunday TEXT,
            travel_time_minutes INTEGER DEFAULT 15,
            low_stock_threshold INTEGER DEFAULT 5,
            restock_target_days INTEGER DEFAULT 14,
            printer_format TEXT DEFAULT 'thermal_4x6',
            audio_mode TEXT DEFAULT 'tones',
            voice_id TEXT,
            audio_volume INTEGER DEFAULT 80,
            audio_muted BOOLEAN DEFAULT 0,
            setup_complete BOOLEAN DEFAULT 0,
            surge_threshold INTEGER DEFAULT 40,
            created_at TEXT,
            updated_at TEXT
        )
    """)
    
    # Colors table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS colors (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL UNIQUE,
            display_order INTEGER NOT NULL,
            created_at TEXT
        )
    """)
    
    # Pack types table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS pack_types (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL UNIQUE,
            display_order INTEGER NOT NULL,
            created_at TEXT
        )
    """)
    
    # Inventory table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS inventory (
            id TEXT PRIMARY KEY,
            color_id TEXT NOT NULL,
            pack_type_id TEXT NOT NULL,
            stock_count INTEGER DEFAULT 0,
            updated_at TEXT,
            UNIQUE(color_id, pack_type_id),
            FOREIGN KEY(color_id) REFERENCES colors(id),
            FOREIGN KEY(pack_type_id) REFERENCES pack_types(id)
        )
    """)
    
    # Batches table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS batches (
            id TEXT PRIMARY KEY,
            started_at TEXT,
            committed_at TEXT,
            archived_at TEXT,
            status TEXT DEFAULT 'active',
            created_at TEXT
        )
    """)
    
    # Manifest zones table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS manifest_zones (
            id TEXT PRIMARY KEY,
            batch_id TEXT NOT NULL,
            zone_index INTEGER NOT NULL,
            zone_name TEXT NOT NULL,
            csv_filename TEXT,
            total_orders INTEGER DEFAULT 0,
            scanned_count INTEGER DEFAULT 0,
            created_at TEXT,
            FOREIGN KEY(batch_id) REFERENCES batches(id)
        )
    """)
    
    # Uploaded files table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS uploaded_files (
            id TEXT PRIMARY KEY,
            batch_id TEXT NOT NULL,
            filename TEXT NOT NULL,
            file_type TEXT NOT NULL,
            file_path TEXT NOT NULL,
            label_count INTEGER,
            order_count INTEGER,
            package_count INTEGER,
            manifest_zone_id TEXT,
            oldest_order_date TEXT,
            printed BOOLEAN DEFAULT 0,
            uploaded_at TEXT,
            FOREIGN KEY(batch_id) REFERENCES batches(id),
            FOREIGN KEY(manifest_zone_id) REFERENCES manifest_zones(id)
        )
    """)
    
    # Scans table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS scans (
            id TEXT PRIMARY KEY,
            batch_id TEXT NOT NULL,
            tracking_number TEXT NOT NULL,
            normalized_tracking TEXT NOT NULL,
            variant_name TEXT,
            product_name TEXT,
            zone_type TEXT DEFAULT 'clerk',
            manifest_zone_index INTEGER,
            scanned_at TEXT,
            created_at TEXT,
            FOREIGN KEY(batch_id) REFERENCES batches(id)
        )
    """)
    
    # CSV orders table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS csv_orders (
            id TEXT PRIMARY KEY,
            batch_id TEXT NOT NULL,
            tracking_number TEXT NOT NULL,
            normalized_tracking TEXT NOT NULL,
            order_id TEXT,
            variant_name TEXT,
            product_name TEXT,
            quantity INTEGER DEFAULT 1,
            manifest_zone_id TEXT,
            manifest_zone_index INTEGER,
            order_date TEXT,
            created_at TEXT,
            FOREIGN KEY(batch_id) REFERENCES batches(id),
            FOREIGN KEY(manifest_zone_id) REFERENCES manifest_zones(id)
        )
    """)
    
    # Hold queue table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS hold_queue (
            id TEXT PRIMARY KEY,
            batch_id TEXT,
            tracking_number TEXT NOT NULL UNIQUE,
            variant_name TEXT,
            color_id TEXT,
            pack_type_id TEXT,
            deadline TEXT NOT NULL,
            status TEXT DEFAULT 'held',
            shipped_at TEXT,
            cancelled_at TEXT,
            created_at TEXT,
            FOREIGN KEY(batch_id) REFERENCES batches(id)
        )
    """)
    
    # History sessions table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS history_sessions (
            id TEXT PRIMARY KEY,
            archived_at TEXT,
            batch_count INTEGER NOT NULL,
            total_packages INTEGER NOT NULL,
            variant_breakdown TEXT,
            dropped_off_at TEXT,
            carrier_accepted_at TEXT,
            created_at TEXT
        )
    """)
    
    # Inventory transactions table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS inventory_transactions (
            id TEXT PRIMARY KEY,
            inventory_id TEXT NOT NULL,
            quantity_change INTEGER NOT NULL,
            reason TEXT NOT NULL,
            batch_id TEXT,
            created_at TEXT,
            FOREIGN KEY(inventory_id) REFERENCES inventory(id),
            FOREIGN KEY(batch_id) REFERENCES batches(id)
        )
    """)
    
    conn.commit()
    conn.close()

def seed_catalog():
    """Seed default colors and pack types"""
    conn = get_db()
    cursor = conn.cursor()
    
    colors = [
        'Pink', 'Purple', 'Red', 'Black', 'Gray', 'Orange', 'White', 
        'Dark Blue', 'Hot Pink', 'Gold', 'Teal', 'Yellow', 
        'Charcoal', 'Green', 'Blue', 'Metallic Red'
    ]
    
    pack_types = ['2 Pack', '4 Pack', '4 Pack No Lanyard']
    
    # Insert colors
    for i, color in enumerate(colors, 1):
        color_id = str(uuid.uuid4())
        cursor.execute(
            "INSERT OR IGNORE INTO colors (id, name, display_order, created_at) VALUES (?, ?, ?, ?)",
            (color_id, color, i, datetime.now().isoformat())
        )
    
    # Insert pack types
    for i, pack_type in enumerate(pack_types, 1):
        pack_type_id = str(uuid.uuid4())
        cursor.execute(
            "INSERT OR IGNORE INTO pack_types (id, name, display_order, created_at) VALUES (?, ?, ?, ?)",
            (pack_type_id, pack_type, i, datetime.now().isoformat())
        )
    
    # Create inventory SKUs (colors × pack types)
    cursor.execute("SELECT id FROM colors ORDER BY display_order")
    color_ids = [row[0] for row in cursor.fetchall()]
    
    cursor.execute("SELECT id FROM pack_types ORDER BY display_order")
    pack_type_ids = [row[0] for row in cursor.fetchall()]
    
    for color_id in color_ids:
        for pack_type_id in pack_type_ids:
            inv_id = str(uuid.uuid4())
            cursor.execute(
                "INSERT OR IGNORE INTO inventory (id, color_id, pack_type_id, stock_count, updated_at) VALUES (?, ?, ?, ?, ?)",
                (inv_id, color_id, pack_type_id, 0, datetime.now().isoformat())
            )
    
    # Create default settings
    settings_id = str(uuid.uuid4())
    cursor.execute(
        "INSERT OR IGNORE INTO settings (id, created_at, updated_at) VALUES (?, ?, ?)",
        (settings_id, datetime.now().isoformat(), datetime.now().isoformat())
    )
    
    conn.commit()
    conn.close()

if __name__ == "__main__":
    init_db()
    seed_catalog()
    print("Database initialized successfully!")
