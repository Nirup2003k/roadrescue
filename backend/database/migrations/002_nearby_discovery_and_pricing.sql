-- ============================================================
-- Migration 002: Nearby mechanic discovery + price/ETA snapshots
-- Safe to run against the existing roadrescue database.
-- Adds columns only — does not drop or recreate anything.
-- Safe to re-run: columns use IF NOT EXISTS, constraints use a
-- DO block that ignores "already exists" errors.
-- ============================================================

ALTER TABLE mechanics ADD COLUMN IF NOT EXISTS latitude  DECIMAL(9,6);
ALTER TABLE mechanics ADD COLUMN IF NOT EXISTS longitude DECIMAL(9,6);

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS latitude       DECIMAL(9,6);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS longitude      DECIMAL(9,6);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS price_snapshot DECIMAL(10,2);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS distance_km    DECIMAL(6,2);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS eta_minutes    INTEGER;

DO $$ BEGIN
  ALTER TABLE mechanics ADD CONSTRAINT chk_mechanics_lat CHECK (latitude  IS NULL OR latitude  BETWEEN -90 AND 90);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE mechanics ADD CONSTRAINT chk_mechanics_lng CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE bookings ADD CONSTRAINT chk_bookings_lat CHECK (latitude  IS NULL OR latitude  BETWEEN -90 AND 90);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE bookings ADD CONSTRAINT chk_bookings_lng CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

UPDATE bookings b SET price_snapshot = s.base_price
FROM services s WHERE b.service_id = s.id AND b.price_snapshot IS NULL;

UPDATE mechanics m SET latitude = 12.975800, longitude = 77.604500
  FROM users u WHERE m.user_id = u.id AND u.email = 'suresh.kumar@example.com';
UPDATE mechanics m SET latitude = 12.935200, longitude = 77.624500
  FROM users u WHERE m.user_id = u.id AND u.email = 'manoj.singh@example.com';
UPDATE mechanics m SET latitude = 12.978400, longitude = 77.640800
  FROM users u WHERE m.user_id = u.id AND u.email = 'ravi.teja@example.com';
UPDATE mechanics m SET latitude = 12.969800, longitude = 77.750000
  FROM users u WHERE m.user_id = u.id AND u.email = 'karan.mehta@example.com';
UPDATE mechanics m SET latitude = 12.925000, longitude = 77.593800
  FROM users u WHERE m.user_id = u.id AND u.email = 'vikas.yadav@example.com';
