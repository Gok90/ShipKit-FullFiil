-- ShipKit Database Schema
-- Run this script to initialize all tables

-- Create enums
DO $$ BEGIN
    CREATE TYPE printer_format AS ENUM ('thermal_4x6', 'standard_8x11');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE audio_mode AS ENUM ('tones', 'voice');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE batch_status AS ENUM ('active', 'committed', 'archived');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE zone AS ENUM ('primary', 'secondary');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE file_type AS ENUM ('label_pdf', 'manifest_csv', 'usps_slip');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE hold_status AS ENUM ('held', 'shipped', 'cancelled', 'dismissed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE transaction_reason AS ENUM ('ship', 'restock', 'adjustment', 'cancel_reverse');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Settings table
CREATE TABLE IF NOT EXISTS settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_name TEXT DEFAULT 'My Store',
    primary_zone_name TEXT DEFAULT 'Manifest',
    secondary_zone_name TEXT DEFAULT 'Clerk Counter',
    carrier_close_weekday TIME DEFAULT '17:00',
    carrier_close_saturday TIME DEFAULT '14:00',
    carrier_close_sunday TIME,
    travel_time_minutes INTEGER DEFAULT 15,
    low_stock_threshold INTEGER DEFAULT 5,
    restock_target_days INTEGER DEFAULT 14,
    printer_format printer_format DEFAULT 'thermal_4x6',
    audio_mode audio_mode DEFAULT 'tones',
    voice_id TEXT,
    audio_volume INTEGER DEFAULT 80,
    audio_muted BOOLEAN DEFAULT false,
    setup_complete BOOLEAN DEFAULT false,
    surge_threshold INTEGER DEFAULT 40,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Colors table
CREATE TABLE IF NOT EXISTS colors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    display_order INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Pack types table
CREATE TABLE IF NOT EXISTS pack_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    display_order INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Inventory table
CREATE TABLE IF NOT EXISTS inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    color_id UUID NOT NULL REFERENCES colors(id) ON DELETE CASCADE,
    pack_type_id UUID NOT NULL REFERENCES pack_types(id) ON DELETE CASCADE,
    stock_count INTEGER DEFAULT 0,
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(color_id, pack_type_id)
);

-- Variant aliases table
CREATE TABLE IF NOT EXISTS variant_aliases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tiktok_name TEXT NOT NULL UNIQUE,
    color_id UUID NOT NULL REFERENCES colors(id) ON DELETE CASCADE,
    pack_type_id UUID NOT NULL REFERENCES pack_types(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Batches table
CREATE TABLE IF NOT EXISTS batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    started_at TIMESTAMP DEFAULT NOW(),
    committed_at TIMESTAMP,
    archived_at TIMESTAMP,
    primary_zone_count INTEGER DEFAULT 0,
    secondary_zone_count INTEGER DEFAULT 0,
    status batch_status DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Scans table
CREATE TABLE IF NOT EXISTS scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    tracking_number TEXT NOT NULL,
    normalized_tracking TEXT NOT NULL,
    variant_name TEXT,
    product_name TEXT,
    zone zone NOT NULL,
    scanned_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Uploaded files table
CREATE TABLE IF NOT EXISTS uploaded_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    file_type file_type NOT NULL,
    file_data TEXT NOT NULL,
    label_count INTEGER,
    order_count INTEGER,
    oldest_order_date TIMESTAMP,
    printed BOOLEAN DEFAULT false,
    uploaded_at TIMESTAMP DEFAULT NOW()
);

-- Hold queue table
CREATE TABLE IF NOT EXISTS hold_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID REFERENCES batches(id) ON DELETE SET NULL,
    tracking_number TEXT NOT NULL,
    variant_name TEXT,
    color_id UUID REFERENCES colors(id) ON DELETE SET NULL,
    pack_type_id UUID REFERENCES pack_types(id) ON DELETE SET NULL,
    deadline TIMESTAMP NOT NULL,
    status hold_status DEFAULT 'held',
    shipped_at TIMESTAMP,
    cancelled_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- History sessions table
CREATE TABLE IF NOT EXISTS history_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    archived_at TIMESTAMP DEFAULT NOW(),
    batch_count INTEGER NOT NULL,
    total_packages INTEGER NOT NULL,
    primary_zone_total INTEGER NOT NULL,
    secondary_zone_total INTEGER NOT NULL,
    variant_breakdown JSONB,
    slip_files JSONB,
    dropped_off_at TIMESTAMP,
    carrier_accepted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Inventory transactions table
CREATE TABLE IF NOT EXISTS inventory_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inventory_id UUID NOT NULL REFERENCES inventory(id) ON DELETE CASCADE,
    quantity_change INTEGER NOT NULL,
    reason transaction_reason NOT NULL,
    batch_id UUID REFERENCES batches(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Cancellations table
CREATE TABLE IF NOT EXISTS cancellations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tracking_number TEXT NOT NULL UNIQUE,
    batch_id UUID REFERENCES batches(id) ON DELETE SET NULL,
    variant_name TEXT,
    flagged_before_scan BOOLEAN DEFAULT false,
    inventory_reversed BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- CSV orders table
CREATE TABLE IF NOT EXISTS csv_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    tracking_number TEXT NOT NULL,
    normalized_tracking TEXT NOT NULL,
    order_id TEXT,
    variant_name TEXT,
    product_name TEXT,
    quantity INTEGER DEFAULT 1,
    order_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_scans_batch_id ON scans(batch_id);
CREATE INDEX IF NOT EXISTS idx_scans_normalized_tracking ON scans(normalized_tracking);
CREATE INDEX IF NOT EXISTS idx_uploaded_files_batch_id ON uploaded_files(batch_id);
CREATE INDEX IF NOT EXISTS idx_hold_queue_status ON hold_queue(status);
CREATE INDEX IF NOT EXISTS idx_csv_orders_batch_id ON csv_orders(batch_id);
CREATE INDEX IF NOT EXISTS idx_csv_orders_normalized_tracking ON csv_orders(normalized_tracking);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_inventory_id ON inventory_transactions(inventory_id);
