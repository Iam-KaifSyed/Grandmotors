CREATE TABLE IF NOT EXISTS media_assets (
  id TEXT PRIMARY KEY,
  filename TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'upload' CHECK (source IN ('upload','builtin','external')),
  publicUrl TEXT,
  objectKey TEXT UNIQUE,
  mimeType TEXT NOT NULL,
  width INTEGER,
  height INTEGER,
  byteSize INTEGER,
  previousObjectKey TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  createdBy TEXT
);

CREATE INDEX IF NOT EXISTS idx_media_assets_filename ON media_assets(filename);

CREATE TABLE IF NOT EXISTS media_references (
  id TEXT PRIMARY KEY,
  usageLocation TEXT NOT NULL UNIQUE,
  mediaAssetId TEXT NOT NULL REFERENCES media_assets(id),
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedBy TEXT
);

CREATE INDEX IF NOT EXISTS idx_media_references_asset ON media_references(mediaAssetId);

CREATE TABLE IF NOT EXISTS service_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  displayOrder INTEGER NOT NULL,
  active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS services (
  id TEXT PRIMARY KEY,
  categoryId TEXT REFERENCES service_categories(id),
  title TEXT NOT NULL,
  summary TEXT,
  itemsJson TEXT NOT NULL DEFAULT '[]',
  mediaAssetId TEXT REFERENCES media_assets(id),
  imagePath TEXT,
  displayOrder INTEGER NOT NULL,
  visibleInCatalogue INTEGER NOT NULL DEFAULT 1,
  selectableInBooking INTEGER NOT NULL DEFAULT 1,
  active INTEGER NOT NULL DEFAULT 1,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  createdBy TEXT,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedBy TEXT
);

CREATE INDEX IF NOT EXISTS idx_services_catalogue ON services(active, visibleInCatalogue, displayOrder);
CREATE INDEX IF NOT EXISTS idx_services_booking ON services(active, selectableInBooking, displayOrder);

CREATE TABLE IF NOT EXISTS booking_form_config (
  key TEXT PRIMARY KEY,
  heading TEXT NOT NULL,
  supportingText TEXT NOT NULL,
  fieldLabelsJson TEXT NOT NULL,
  optionalFieldVisibilityJson TEXT NOT NULL,
  customQuestionsJson TEXT NOT NULL,
  confirmationMessage TEXT NOT NULL,
  appointmentSlotsJson TEXT NOT NULL,
  bookingWindowJson TEXT NOT NULL,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedBy TEXT
);

CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY,
  entityType TEXT NOT NULL,
  entityId TEXT NOT NULL,
  action TEXT NOT NULL,
  actorAdmin TEXT NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  summary TEXT
);

CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON audit_log(entityType, entityId);
