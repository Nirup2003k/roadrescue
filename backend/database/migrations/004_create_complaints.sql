-- ============================================================
-- Migration 004: Complaints & Disputes Manual Workflow
-- Safe to run against existing roadrescue PostgreSQL database.
-- Additive only — creates complaints table if not exists.
-- ============================================================

CREATE TABLE IF NOT EXISTS complaints (
  id                  SERIAL PRIMARY KEY,
  booking_id          INTEGER NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  reporter_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reporter_role       TEXT NOT NULL CHECK (reporter_role IN ('customer', 'mechanic')),
  subject             VARCHAR(150) NOT NULL,
  description         VARCHAR(1000) NOT NULL,
  status              TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'resolved', 'dismissed')),
  admin_notes         VARCHAR(500) NULL,
  created_at          TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMP NOT NULL DEFAULT NOW()
);

DO $$ BEGIN
  CREATE TRIGGER trg_complaints_updated_at BEFORE UPDATE ON complaints
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_complaints_booking ON complaints(booking_id);
CREATE INDEX IF NOT EXISTS idx_complaints_reporter ON complaints(reporter_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);
