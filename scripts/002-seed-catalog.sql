-- ShipKit Seed Data
-- Populates initial catalog with colors, pack types, and inventory combinations

-- Insert default settings (only if none exist)
INSERT INTO settings (id, store_name, primary_zone_name, secondary_zone_name)
SELECT gen_random_uuid(), 'My Store', 'Manifest', 'Clerk Counter'
WHERE NOT EXISTS (SELECT 1 FROM settings LIMIT 1);

-- Insert colors (16 colors)
INSERT INTO colors (name, display_order) VALUES
    ('Pink', 1),
    ('Purple', 2),
    ('Red', 3),
    ('Black', 4),
    ('Gray', 5),
    ('Orange', 6),
    ('White', 7),
    ('Dark Blue', 8),
    ('Hot Pink', 9),
    ('Gold', 10),
    ('Teal', 11),
    ('Yellow', 12),
    ('Charcoal', 13),
    ('Green', 14),
    ('Blue', 15),
    ('Metallic Red', 16)
ON CONFLICT DO NOTHING;

-- Insert pack types (3 types)
INSERT INTO pack_types (name, display_order) VALUES
    ('2 Pack', 1),
    ('4 Pack', 2),
    ('4 Pack No Lanyard', 3)
ON CONFLICT DO NOTHING;

-- Create inventory entries for all color/pack combinations (48 SKUs)
-- This uses a cross join to create all combinations
INSERT INTO inventory (color_id, pack_type_id, stock_count)
SELECT c.id, p.id, 0
FROM colors c
CROSS JOIN pack_types p
ON CONFLICT (color_id, pack_type_id) DO NOTHING;
