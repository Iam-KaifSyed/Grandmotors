-- Migration: Add source column to bookings table for lead source tracking

ALTER TABLE bookings ADD COLUMN source TEXT;
