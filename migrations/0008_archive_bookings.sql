-- Migration: Add isArchived and archivedAt columns to bookings table for safe archiving

ALTER TABLE bookings ADD COLUMN isArchived INTEGER DEFAULT 0;
ALTER TABLE bookings ADD COLUMN archivedAt DATETIME;
