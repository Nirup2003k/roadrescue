-- ============================================================
-- RoadRescue Database Schema — PostgreSQL 14+
-- ============================================================
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS mechanic_services CASCADE;
DROP TABLE IF EXISTS vehicles CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS mechanics CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP FUNCTION IF EXISTS set_updated_at() CASCADE;

CREATE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE users (
  id                SERIAL PRIMARY KEY,
  name              VARCHAR(100)        NOT NULL,
  email             VARCHAR(150)        NOT NULL UNIQUE,
  password_hash     VARCHAR(255)        NOT NULL,
  phone             VARCHAR(20)         NOT NULL,
  role              TEXT                NOT NULL CHECK (role IN ('customer', 'mechanic', 'admin')),
  status            TEXT                NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  created_at        TIMESTAMP           NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMP           NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE customers (
  user_id           INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  address           VARCHAR(255)        NULL,
  city              VARCHAR(100)        NULL
);

CREATE TABLE mechanics (
  user_id             INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  bio                 VARCHAR(500)      NULL,
  experience_years    SMALLINT          NOT NULL DEFAULT 0,
  service_area        VARCHAR(150)      NULL,
  availability_status TEXT              NOT NULL DEFAULT 'offline' CHECK (availability_status IN ('available', 'busy', 'offline')),
  approval_status     TEXT              NOT NULL DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'suspended'))
);
CREATE INDEX idx_mechanics_approval ON mechanics(approval_status);
CREATE INDEX idx_mechanics_availability ON mechanics(availability_status);

CREATE TABLE services (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(100)   NOT NULL UNIQUE,
  description   VARCHAR(255)   NULL,
  base_price    DECIMAL(10,2)  NOT NULL DEFAULT 0.00,
  is_active     BOOLEAN        NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMP      NOT NULL DEFAULT NOW()
);

CREATE TABLE mechanic_services (
  id            SERIAL PRIMARY KEY,
  mechanic_id   INTEGER NOT NULL REFERENCES mechanics(user_id) ON DELETE CASCADE,
  service_id    INTEGER NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  UNIQUE (mechanic_id, service_id)
);

CREATE TABLE vehicles (
  id                    SERIAL PRIMARY KEY,
  customer_id           INTEGER NOT NULL REFERENCES customers(user_id) ON DELETE CASCADE,
  vehicle_type          TEXT    NOT NULL CHECK (vehicle_type IN ('Car', 'Bike', 'Truck', 'Other')),
  brand                 VARCHAR(60)  NOT NULL,
  model                 VARCHAR(60)  NOT NULL,
  registration_number   VARCHAR(20)  NOT NULL UNIQUE,
  created_at            TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMP    NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_vehicles_updated_at BEFORE UPDATE ON vehicles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE INDEX idx_vehicles_customer ON vehicles(customer_id);

CREATE TABLE bookings (
  id                    SERIAL PRIMARY KEY,
  customer_id           INTEGER NOT NULL REFERENCES customers(user_id) ON DELETE CASCADE,
  vehicle_id            INTEGER NOT NULL REFERENCES vehicles(id)  ON DELETE CASCADE,
  mechanic_id           INTEGER NOT NULL REFERENCES mechanics(user_id) ON DELETE CASCADE,
  service_id            INTEGER NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  problem_description   VARCHAR(1000) NOT NULL,
  location_address      VARCHAR(255)  NOT NULL,
  status                TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'in_progress', 'completed', 'cancelled')),
  cancellation_reason   VARCHAR(255)  NULL,
  requested_at          TIMESTAMP     NOT NULL DEFAULT NOW(),
  accepted_at           TIMESTAMP     NULL,
  started_at            TIMESTAMP     NULL,
  completed_at          TIMESTAMP     NULL,
  cancelled_at          TIMESTAMP     NULL,
  updated_at            TIMESTAMP     NOT NULL DEFAULT NOW(),
  latitude              DECIMAL(9,6)  NULL,
  longitude             DECIMAL(9,6)  NULL,
  price_snapshot        DECIMAL(10,2) NULL,
  distance_km           DECIMAL(6,2)  NULL,
  eta_minutes           INTEGER       NULL
);
CREATE TRIGGER trg_bookings_updated_at BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE INDEX idx_bookings_customer ON bookings(customer_id);
CREATE INDEX idx_bookings_mechanic ON bookings(mechanic_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_vehicle ON bookings(vehicle_id);

ALTER TABLE mechanics ADD COLUMN latitude DECIMAL(9,6);
ALTER TABLE mechanics ADD COLUMN longitude DECIMAL(9,6);

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

CREATE TABLE reviews (
  id            SERIAL PRIMARY KEY,
  booking_id    INTEGER NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
  customer_id   INTEGER NOT NULL REFERENCES customers(user_id) ON DELETE CASCADE,
  mechanic_id   INTEGER NOT NULL REFERENCES mechanics(user_id) ON DELETE CASCADE,
  rating        SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment       VARCHAR(500) NULL,
  created_at    TIMESTAMP    NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_reviews_mechanic ON reviews(mechanic_id);
