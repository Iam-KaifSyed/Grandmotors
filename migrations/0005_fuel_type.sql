-- Migration: Add fuelType column to bookings table

ALTER TABLE bookings ADD COLUMN fuelType TEXT;
