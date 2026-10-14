-- Migration: Add Car Battery Jump Start service to catalogue

INSERT OR IGNORE INTO media_assets (id, filename, source, publicUrl, mimeType, width, height, byteSize, createdAt, createdBy)
VALUES (
  'builtin-service-car-battery-jump-start',
  'service-jump-start.jpg',
  'external',
  'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=1200&q=80',
  'image/jpeg',
  1200,
  800,
  NULL,
  CURRENT_TIMESTAMP,
  'system'
);

INSERT OR IGNORE INTO media_references (id, usageLocation, mediaAssetId, updatedAt, updatedBy)
VALUES (
  'ref-service-car-battery-jump-start',
  'service-car-battery-jump-start',
  'builtin-service-car-battery-jump-start',
  CURRENT_TIMESTAMP,
  'system'
);

INSERT OR IGNORE INTO services (
  id,
  title,
  summary,
  itemsJson,
  mediaAssetId,
  imagePath,
  displayOrder,
  visibleInCatalogue,
  selectableInBooking,
  active,
  createdAt,
  createdBy,
  updatedAt,
  updatedBy
)
VALUES (
  'car-battery-jump-start',
  'Car Battery Jump Start',
  'Professional jump start assistance to safely start your car when its battery is discharged or flat.',
  '["Safe battery jump start with surge & reverse-polarity protection","Discharged battery testing & state-of-health diagnostics","Alternator charging output & starter motor check","Terminal cleaning & secure connection inspection","Parasitic electrical leakage & drain check","Doorstep & emergency roadside assistance"]',
  'builtin-service-car-battery-jump-start',
  'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=1200&q=80',
  9,
  1,
  1,
  1,
  CURRENT_TIMESTAMP,
  'system',
  CURRENT_TIMESTAMP,
  'system'
);
