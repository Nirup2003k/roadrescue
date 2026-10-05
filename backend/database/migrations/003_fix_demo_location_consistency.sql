-- ============================================================
-- Migration 003: Fix demo booking location text vs. coordinates
-- Non-destructive: only updates location_address TEXT on the specific
-- known seed rows where the city named in the address didn't match
-- the Bengaluru-area coordinates actually stored for that booking
-- (left over from when mechanics were consolidated into one metro
-- area for the nearby-discovery demo). No columns, no data loss.
-- Safe to re-run — each UPDATE only matches the exact old text.
-- ============================================================

UPDATE bookings SET location_address = 'Church Street, Bengaluru'
  WHERE location_address = 'Bandra West, Mumbai';

UPDATE bookings SET location_address = '100 Feet Road, Indiranagar, Bengaluru'
  WHERE location_address = 'Andheri East, Mumbai';

UPDATE bookings SET location_address = 'Sony World Signal, Koramangala, Bengaluru'
  WHERE location_address = 'Ring Road, near Dhaula Kuan, Delhi';

UPDATE bookings SET location_address = 'ITPL Main Road, Whitefield, Bengaluru'
  WHERE location_address = 'DND Flyway, Delhi';

UPDATE bookings SET location_address = 'Residency Road, Bengaluru'
  WHERE location_address = 'Jubilee Hills Road No. 36, Hyderabad' AND status = 'cancelled';

UPDATE bookings SET location_address = 'Forum Mall, Koramangala, Bengaluru'
  WHERE location_address = 'Banjara Hills, Hyderabad' AND status = 'rejected';

UPDATE bookings SET location_address = 'Old Airport Road, Indiranagar, Bengaluru'
  WHERE location_address = 'Banjara Hills, Hyderabad' AND status = 'pending';
