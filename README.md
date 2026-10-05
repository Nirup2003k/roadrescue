# RoadRescue — Roadside Vehicle Assistance & Mechanic Booking Platform

A full-stack web application where customers request roadside vehicle assistance from nearby, verified mechanics, mechanics accept and work through jobs, and an admin oversees the platform.

## Tech Stack

| Layer      | Choice                                   |
|------------|--------------------------------------------|
| Frontend   | React 18 (Vite), React Router, Tailwind CSS, Axios, Recharts, lucide-react |
| Backend    | Node.js, Express                          |
| Database   | PostgreSQL 14+ (`pg` driver, raw parameterized SQL — no ORM) |
| Auth       | JWT (access token) + bcrypt password hashing |

## Getting Started

### 1. Database
```bash
psql -U roadrescue_user -d roadrescue -f backend/database/schema.sql
```
Applying a **fresh** database. If you already have a working `roadrescue` database, don't rerun `schema.sql` (it drops tables) — instead see **Migrations** below.

### 2. Backend
```bash
cd backend
npm install
npm run seed      # demo data — see Demo Credentials below
npm run dev        # http://localhost:5000
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev        # http://localhost:5173, proxies /api to :5000
```

## Migrations

`backend/database/migrations/` holds incremental, non-destructive SQL files to run against an **existing** database (adds columns only — never drops data). Apply in order:

```bash
psql -U roadrescue_user -d roadrescue -f backend/database/migrations/002_nearby_discovery_and_pricing.sql
```

This one is safe to re-run (uses `ADD COLUMN IF NOT EXISTS` and idempotent constraint guards). It adds:
- `mechanics.latitude` / `longitude`
- `bookings.latitude` / `longitude` / `price_snapshot` / `distance_km` / `eta_minutes`
- Backfills `price_snapshot` on existing bookings from their service's current price
- Sets coordinates on the 5 seeded demo mechanics

## Demo Credentials

All accounts use `password123` except the admin (`Admin@123`):

| Role     | Email                          | Notes |
|----------|----------------------------------|-------|
| Admin    | `admin@roadrescue.com`          | |
| Customer | `rahul.sharma@example.com`      | |
| Mechanic | `suresh.kumar@example.com`      | Available, Bengaluru — closest to a Bengaluru search |
| Mechanic | `manoj.singh@example.com`       | Available, Bengaluru — farther out |
| Mechanic | `ravi.teja@example.com`         | **Busy** — excluded from nearby search/booking |
| Mechanic | `karan.mehta@example.com`       | **Offline** — excluded from nearby search/booking |
| Mechanic | `vikas.yadav@example.com`       | **Pending approval** — excluded from nearby search/booking |

Try a nearby search around `lat=12.975, lng=77.605` (central Bengaluru) to see the distance/ETA sort with Suresh closest.

## Feature Additions (Phase 1–3)

**Phase 1 — Core logic & data integrity**
- Mechanic `approval_status`/`availability_status` fully enforced server-side: only `approved` + `available` mechanics can be assigned a booking or accept one.
- Accepting a booking atomically flips the mechanic to `busy` (row-locked to avoid a race between two simultaneous accepts); completing a job or cancelling an accepted booking releases them back to `available` — but only if they have no other active job.
- A mechanic can't manually mark themselves `available` while they still have an active job.
- Bookings store `latitude`/`longitude` for the breakdown location (validated -90..90 / -180..180).
- Bookings snapshot the service's price (`price_snapshot`) at creation time — changing a service's price later never alters past bookings' recorded price. Mechanic earnings sum snapshots, not live prices.
- `POST /bookings` re-validates everything server-side (vehicle ownership, service active, mechanic approved **and** available **and** offering the service, no duplicate active booking) — never trusts frontend-supplied IDs, closing the race window between nearby-discovery and submission.
- Booking status transitions are a strict state machine (`pending→accepted→in_progress→completed`, plus `pending→rejected` and `{pending,accepted}→cancelled`); everything else is rejected.

**Phase 2 — Nearby mechanic discovery**
- `GET /api/mechanics/nearby?lat=&lng=&serviceId=` — returns only mechanics who are active, approved, available, offer the requested service, and have coordinates; sorted nearest-first by real Haversine distance.
- The Request Assistance flow now captures the customer's breakdown location (via browser geolocation or manual lat/lng) and calls this endpoint instead of showing all mechanics.

**Phase 3 — ETA estimation**
- `estimated_arrival_minutes = round((distance_km / AVG_SPEED_KMH) * 60)`, computed in `backend/src/utils/geo.js`. `AVG_SPEED_KMH` (default `30`) lives in `backend/src/config/constants.js`, overridable via the `AVG_SPEED_KMH` env var — not hardcoded inline anywhere.
- Distance and ETA are snapshotted onto the booking at creation time alongside the price.

Explicitly **not** implemented (out of scope per spec): live tracking, WebSockets, payments, chat, AI ETA.
