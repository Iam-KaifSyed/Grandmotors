-- Migration: Add gallery_items table for Past Work Gallery
CREATE TABLE IF NOT EXISTS gallery_items (
  id TEXT PRIMARY KEY,
  mediaAssetId TEXT NOT NULL REFERENCES media_assets(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT '',
  description TEXT,
  categoryId TEXT REFERENCES service_categories(id) ON DELETE SET NULL,
  displayOrder INTEGER NOT NULL DEFAULT 0,
  published INTEGER NOT NULL DEFAULT 0,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  createdBy TEXT,
  updatedBy TEXT
);

CREATE INDEX IF NOT EXISTS idx_gallery_display ON gallery_items(published, displayOrder);
CREATE INDEX IF NOT EXISTS idx_gallery_media ON gallery_items(mediaAssetId);

-- Seed initial service categories if not already present
INSERT OR IGNORE INTO service_categories (id, name, displayOrder, active) VALUES
  ('engine-diagnostics', 'Engine & Diagnostics', 1, 1),
  ('brakes', 'Brakes & Braking Systems', 2, 1),
  ('tyres-alignment', 'Tyres & Wheel Alignment', 3, 1),
  ('ac-electrical', 'AC & Electrical', 4, 1),
  ('suspension-steering', 'Suspension & Steering', 5, 1),
  ('general-service', 'General Service & Maintenance', 6, 1),
  ('body-paint', 'Body & Paint Refinishing', 7, 1),
  ('detailing-interior', 'Detailing & Protection', 8, 1);
