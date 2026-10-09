-- Migration: Add doorstep servicing columns to bookings table

ALTER TABLE bookings ADD COLUMN serviceLocation TEXT DEFAULT 'Workshop Visit';
ALTER TABLE bookings ADD COLUMN doorstepHouseFlat TEXT;
ALTER TABLE bookings ADD COLUMN doorstepStreetLocality TEXT;
ALTER TABLE bookings ADD COLUMN doorstepCity TEXT;
ALTER TABLE bookings ADD COLUMN doorstepPincode TEXT;
ALTER TABLE bookings ADD COLUMN doorstepLatitude REAL;
ALTER TABLE bookings ADD COLUMN doorstepLongitude REAL;
ALTER TABLE bookings ADD COLUMN doorstepMapUrl TEXT;
