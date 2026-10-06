import json
import urllib.request
import urllib.error
import sys

BASE = "http://localhost:5000/api"
PASS = 0
FAIL = 0

# Roughly central Bengaluru — close to the seeded mechanics' coordinates
LAT, LNG = 12.9750, 77.6050


def call(method, path, token=None, body=None, expect=None, label=""):
    global PASS, FAIL
    url = BASE + path
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            status = resp.status
            payload = json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        status = e.code
        try:
            payload = json.loads(e.read().decode())
        except Exception:
            payload = {}

    ok = True
    if expect is not None and status != expect:
        ok = False
    tag = "PASS" if ok else "FAIL"
    if ok:
        PASS += 1
    else:
        FAIL += 1
    print(f"[{tag}] {label} -> HTTP {status} (expected {expect}) :: {payload.get('message')}")
    return status, payload


print("\n=== AUTH ===")
_, r = call("POST", "/auth/login", body={"email": "rahul.sharma@example.com", "password": "password123"}, expect=200, label="Customer login (Rahul)")
cust_token = r["data"]["token"]
cust_id = r["data"]["user"]["id"]

_, r = call("POST", "/auth/login", body={"email": "suresh.kumar@example.com", "password": "password123"}, expect=200, label="Mechanic login (Suresh)")
mech_token = r["data"]["token"]
mech_id = r["data"]["user"]["id"]

_, r = call("POST", "/auth/login", body={"email": "admin@roadrescue.com", "password": "Admin@123"}, expect=200, label="Admin login")
admin_token = r["data"]["token"]

call("POST", "/auth/login", body={"email": "rahul.sharma@example.com", "password": "wrongpass"}, expect=401, label="Login with wrong password rejected")

import time
ts = int(time.time() * 1000)

print("\n=== REGISTRATION (new customer + new mechanic) ===")
_, r = call("POST", "/auth/register", body={
    "name": "Test Customer", "email": f"test.customer.{ts}@example.com", "password": "test1234",
    "phone": f"91{ts % 100000000:08d}", "role": "customer", "address": "1 Test Lane", "city": "Chennai"
}, expect=201, label="Register new customer")
new_cust_token = r["data"]["token"]

call("POST", "/auth/register", body={
    "name": "Dup Customer", "email": "rahul.sharma@example.com", "password": "test1234",
    "phone": f"92{ts % 100000000:08d}", "role": "customer"
}, expect=409, label="Duplicate email rejected")

call("POST", "/auth/register", body={
    "name": "Bad", "email": "not-an-email", "password": "123", "phone": "abc", "role": "customer"
}, expect=422, label="Invalid registration fields rejected")

_, r = call("POST", "/auth/register", body={
    "name": "New Mechanic Flow", "email": f"new.mechanic.{ts}@example.com", "password": "test1234",
    "phone": f"93{ts % 100000000:08d}", "role": "mechanic", "experienceYears": 1, "serviceArea": "Pune"
}, expect=201, label="Register new mechanic (pending approval)")
new_mech_token = r["data"]["token"]
new_mech_id = r["data"]["user"]["id"]

print("\n=== ROLE-BASED ACCESS CONTROL ===")
call("GET", "/admin/stats", token=cust_token, expect=403, label="Customer blocked from admin stats")
call("GET", "/vehicles", token=mech_token, expect=403, label="Mechanic blocked from customer vehicles route")
call("GET", "/admin/stats", expect=401, label="Anonymous blocked from admin stats")

reg_num = f"TN01ZZ{ts % 10000:04d}"

print("\n=== VEHICLES (customer) ===")
_, r = call("POST", "/vehicles", token=new_cust_token, body={
    "vehicleType": "Car", "brand": "Toyota", "model": "Corolla", "registrationNumber": reg_num
}, expect=201, label="Create vehicle")
vehicle_id = r["data"]["vehicle"]["id"]

call("POST", "/vehicles", token=new_cust_token, body={
    "vehicleType": "Car", "brand": "Toyota", "model": "Corolla", "registrationNumber": reg_num
}, expect=409, label="Duplicate registration number rejected")

call("GET", "/vehicles", token=new_cust_token, expect=200, label="List own vehicles")
call("PUT", f"/vehicles/{vehicle_id}", token=new_cust_token, body={"model": "Corolla Altis"}, expect=200, label="Update vehicle")

print("\n=== SERVICES (public catalog) ===")
_, r = call("GET", "/services", expect=200, label="List active services (public)")
services = {s["name"]: s["id"] for s in r["data"]["services"]}
print("    services:", list(services.keys()))

print("\n=== MECHANICS DIRECTORY ===")
_, r = call("GET", f"/mechanics?serviceId={services['Flat Tyre']}", expect=200, label="Browse mechanics offering Flat Tyre")
approved_mechanic_ids = [m["id"] for m in r["data"]["mechanics"]]
print("    mechanics offering Flat Tyre:", approved_mechanic_ids)
assert new_mech_id not in approved_mechanic_ids, "pending mechanic should not appear in public directory"

print("\n=== PHASE 2: NEARBY MECHANIC DISCOVERY ===")
_, r = call("POST", "/auth/login", body={"email": "manoj.singh@example.com", "password": "password123"}, expect=200, label="(setup) Manoj login")
manoj_id = r["data"]["user"]["id"]
_, r = call("POST", "/auth/login", body={"email": "ravi.teja@example.com", "password": "password123"}, expect=200, label="(setup) Ravi login (busy)")
ravi_id = r["data"]["user"]["id"]
_, r = call("POST", "/auth/login", body={"email": "karan.mehta@example.com", "password": "password123"}, expect=200, label="(setup) Karan login (offline)")
karan_id = r["data"]["user"]["id"]
_, r = call("POST", "/auth/login", body={"email": "vikas.yadav@example.com", "password": "password123"}, expect=200, label="(setup) Vikas login (pending)")
vikas_id = r["data"]["user"]["id"]

call("GET", f"/mechanics/nearby?lat=999&lng={LNG}&serviceId={services['Flat Tyre']}", expect=422, label="Invalid latitude rejected")
call("GET", f"/mechanics/nearby?lat={LAT}&lng=-200&serviceId={services['Flat Tyre']}", expect=422, label="Invalid longitude rejected")
call("GET", f"/mechanics/nearby?lat={LAT}&lng={LNG}", expect=422, label="Missing serviceId rejected")

_, r = call("GET", f"/mechanics/nearby?lat={LAT}&lng={LNG}&serviceId={services['Flat Tyre']}", expect=200, label="Nearby mechanics for Flat Tyre")
nearby = r["data"]["mechanics"]
nearby_ids = [m["id"] for m in nearby]
print("    nearby:", [(m["name"], m["distance_km"], m["estimated_arrival_minutes"]) for m in nearby])
assert mech_id in nearby_ids, "Suresh (available, approved, offers Flat Tyre) should appear"
assert manoj_id in nearby_ids, "Manoj (available, approved, offers Flat Tyre) should appear"
assert ravi_id not in nearby_ids, "Ravi is BUSY, must be excluded"
assert karan_id not in nearby_ids, "Karan is OFFLINE, must be excluded"
assert vikas_id not in nearby_ids, "Vikas is PENDING approval, must be excluded"
distances = [m["distance_km"] for m in nearby]
assert distances == sorted(distances), "results must be sorted nearest-first"

first = nearby[0]
expected_eta = round(first["distance_km"] / 30 * 60)
assert abs(first["estimated_arrival_minutes"] - expected_eta) <= 1, "ETA must follow (distance/avg_speed)*60"
print(f"    distance/ETA formula verified: {first['distance_km']} km -> {first['estimated_arrival_minutes']} min (expected ~{expected_eta})")

_, r = call("GET", f"/mechanics/nearby?lat={LAT}&lng={LNG}&serviceId={services['Battery Replacement']}", expect=200, label="Nearby mechanics for Battery Replacement")
br_ids = [m["id"] for m in r["data"]["mechanics"]]
assert manoj_id not in br_ids, "Manoj does not offer Battery Replacement, must be excluded regardless of distance"

print("\n=== BOOKING LIFECYCLE (new customer + Suresh) ===")
call("POST", "/vehicles", token=new_cust_token, body={
    "vehicleType": "Car", "brand": "Toyota", "model": "Corolla", "registrationNumber": "A1@"
}, expect=422, label="Invalid registration number format rejected")

call("POST", "/bookings", token=new_cust_token, body={
    "vehicleId": vehicle_id, "mechanicId": mech_id, "serviceId": services["Engine Problem"],
    "problemDescription": "Car stalls at traffic lights.", "locationAddress": "Anna Salai, Chennai",
}, expect=422, label="Booking without coordinates rejected")

call("POST", "/bookings", token=new_cust_token, body={
    "vehicleId": vehicle_id, "mechanicId": mech_id, "serviceId": services["Engine Problem"],
    "problemDescription": "Car stalls at traffic lights.", "locationAddress": "Anna Salai, Chennai",
    "latitude": 200, "longitude": LNG,
}, expect=422, label="Booking with out-of-range latitude rejected")

_, r = call("POST", "/bookings", token=new_cust_token, body={
    "vehicleId": vehicle_id, "mechanicId": mech_id, "serviceId": services["Engine Problem"],
    "problemDescription": "Car stalls at traffic lights.", "locationAddress": "Anna Salai, Chennai",
    "latitude": LAT, "longitude": LNG,
}, expect=201, label="Create booking")
booking_id = r["data"]["booking"]["id"]
assert r["data"]["booking"]["status"] == "pending"
assert r["data"]["booking"]["price_snapshot"] is not None, "price_snapshot must be captured at creation"
assert r["data"]["booking"]["distance_km"] is not None, "distance_km must be computed from mechanic coordinates"
original_snapshot = r["data"]["booking"]["price_snapshot"]

call("POST", "/bookings", token=new_cust_token, body={
    "vehicleId": vehicle_id, "mechanicId": mech_id, "serviceId": services["Flat Tyre"],
    "problemDescription": "Also a flat tyre.", "locationAddress": "Anna Salai, Chennai",
    "latitude": LAT, "longitude": LNG,
}, expect=409, label="Duplicate active booking on same vehicle rejected")

call("PUT", f"/bookings/{booking_id}/accept", token=cust_token, expect=403, label="Wrong mechanic cannot accept another mechanic's booking")
call("PUT", f"/bookings/{booking_id}/status", token=mech_token, body={"status": "in_progress"}, expect=409, label="Cannot skip straight to in_progress before accept")

_, r = call("PUT", f"/bookings/{booking_id}/accept", token=mech_token, expect=200, label="Mechanic accepts booking")
assert r["data"]["booking"]["status"] == "accepted"

call("PUT", f"/bookings/{booking_id}/accept", token=mech_token, expect=409, label="Cannot accept an already-accepted booking")

_, r = call("PUT", f"/bookings/{booking_id}/status", token=mech_token, body={"status": "in_progress"}, expect=200, label="Mechanic marks in_progress")
assert r["data"]["booking"]["status"] == "in_progress"

call("PUT", f"/bookings/{booking_id}/cancel", token=new_cust_token, expect=409, label="Cannot cancel once in_progress")

_, r = call("PUT", f"/bookings/{booking_id}/status", token=mech_token, body={"status": "completed"}, expect=200, label="Mechanic marks completed")
assert r["data"]["booking"]["status"] == "completed"

print("\n=== PHASE 1: PRICE SNAPSHOT INTEGRITY ===")
_, r = call("GET", "/services", expect=200, label="Fetch services for price-change test")
engine_service = next(s for s in r["data"]["services"] if s["name"] == "Engine Problem")
bumped_price = float(engine_service["base_price"]) + 500

call("PUT", f"/services/{services['Engine Problem']}", token=admin_token, body={"basePrice": bumped_price}, expect=200, label="Admin raises Engine Problem price")

_, r = call("GET", f"/bookings/{booking_id}", token=new_cust_token, expect=200, label="Re-fetch old booking after price change")
assert float(r["data"]["booking"]["price_snapshot"]) == float(original_snapshot), "old booking's price snapshot must NOT change"
assert float(r["data"]["booking"]["current_service_price"]) == bumped_price, "current service price should reflect the admin's update"
print(f"    confirmed: booking kept price_snapshot={original_snapshot}, live service price is now {bumped_price}")

call("PUT", f"/services/{services['Engine Problem']}", token=admin_token, body={"basePrice": engine_service["base_price"]}, expect=200, label="Admin restores original Engine Problem price")

print("\n=== REVIEWS (PHASE 5 HARDENING) ===")
call("POST", "/reviews", token=new_cust_token, body={"bookingId": booking_id, "rating": 6, "comment": "x"}, expect=422, label="Rating out of range rejected")
_, r = call("POST", "/reviews", token=new_cust_token, body={"bookingId": booking_id, "rating": 5, "comment": "Fixed it fast, great job!"}, expect=201, label="Submit review for completed booking")
call("POST", "/reviews", token=new_cust_token, body={"bookingId": booking_id, "rating": 4}, expect=409, label="Duplicate review rejected")

_, r = call("GET", f"/reviews/mechanic/{mech_id}", expect=200, label="Public mechanic reviews list")
print("    review count for mechanic:", len(r["data"]["reviews"]))

print("\n=== SECOND BOOKING: reject + cancel-before-accept flows ===")
_, r = call("POST", "/bookings", token=new_cust_token, body={
    "vehicleId": vehicle_id, "mechanicId": mech_id, "serviceId": services["Flat Tyre"],
    "problemDescription": "Flat tyre near office.", "locationAddress": "T Nagar, Chennai",
    "latitude": LAT, "longitude": LNG,
}, expect=201, label="Create second booking")
booking2_id = r["data"]["booking"]["id"]

_, r = call("PUT", f"/bookings/{booking2_id}/cancel", token=new_cust_token, body={"reason": "Changed plans"}, expect=200, label="Customer cancels pending booking")
assert r["data"]["booking"]["status"] == "cancelled"
call("POST", "/reviews", token=new_cust_token, body={"bookingId": booking2_id, "rating": 5}, expect=409, label="Review of cancelled/non-completed booking rejected")

_, r = call("POST", "/bookings", token=new_cust_token, body={
    "vehicleId": vehicle_id, "mechanicId": mech_id, "serviceId": services["Flat Tyre"],
    "problemDescription": "Flat tyre again.", "locationAddress": "T Nagar, Chennai",
    "latitude": LAT, "longitude": LNG,
}, expect=201, label="Create third booking")
booking3_id = r["data"]["booking"]["id"]
_, r = call("PUT", f"/bookings/{booking3_id}/reject", token=mech_token, expect=200, label="Mechanic rejects booking")
assert r["data"]["booking"]["status"] == "rejected"

print("\n=== PHASE 1: MECHANIC AVAILABILITY ENFORCEMENT ===")
_, r = call("POST", "/auth/register", body={
    "name": "Avail Test Mechanic", "email": f"avail.test.mech.{ts}@example.com", "password": "test1234",
    "phone": f"96{ts % 100000000:08d}", "role": "mechanic", "experienceYears": 4, "serviceArea": "Bengaluru"
}, expect=201, label="Register availability-test mechanic")
avail_mech_token = r["data"]["token"]
avail_mech_id = r["data"]["user"]["id"]
call("PUT", f"/admin/mechanics/{avail_mech_id}/approve", token=admin_token, expect=200, label="Admin approves availability-test mechanic")
call("PUT", "/mechanics/services", token=avail_mech_token, body={"serviceIds": [services["Flat Tyre"]]}, expect=200, label="Availability-test mechanic offers Flat Tyre")
call("PUT", "/mechanics/availability", token=avail_mech_token, body={"availabilityStatus": "available"}, expect=200, label="Availability-test mechanic sets available")

_, r = call("POST", "/auth/register", body={
    "name": "Avail Test Customer", "email": f"avail.test.cust.{ts}@example.com", "password": "test1234",
    "phone": f"94{ts % 100000000:08d}", "role": "customer"
}, expect=201, label="Register availability-test customer")
avail_cust_token = r["data"]["token"]

call("POST", "/reviews", token=avail_cust_token, body={"bookingId": booking_id, "rating": 5}, expect=404, label="Review for another customer's booking rejected")

_, r = call("POST", "/vehicles", token=avail_cust_token, body={
    "vehicleType": "Car", "brand": "Honda", "model": "Amaze", "registrationNumber": f"KA05AV{ts % 10000:04d}"
}, expect=201, label="Availability-test vehicle A")
avail_vehicle_id = r["data"]["vehicle"]["id"]

_, r = call("POST", "/vehicles", token=avail_cust_token, body={
    "vehicleType": "Bike", "brand": "Honda", "model": "Activa", "registrationNumber": f"KA05BW{ts % 10000:04d}"
}, expect=201, label="Availability-test vehicle B")
avail_vehicle2_id = r["data"]["vehicle"]["id"]

_, r = call("POST", "/bookings", token=avail_cust_token, body={
    "vehicleId": avail_vehicle_id, "mechanicId": avail_mech_id, "serviceId": services["Flat Tyre"],
    "problemDescription": "Flat tyre for availability test.", "locationAddress": "Test Street, Bengaluru",
    "latitude": LAT, "longitude": LNG,
}, expect=201, label="Create booking A for availability-test mechanic")
booking_a_id = r["data"]["booking"]["id"]

_, r = call("POST", "/bookings", token=avail_cust_token, body={
    "vehicleId": avail_vehicle2_id, "mechanicId": avail_mech_id, "serviceId": services["Flat Tyre"],
    "problemDescription": "Second flat tyre, different vehicle.", "locationAddress": "Test Street, Bengaluru",
    "latitude": LAT, "longitude": LNG,
}, expect=201, label="Create booking B for the same (still-available) mechanic")
booking_b_id = r["data"]["booking"]["id"]

call("PUT", f"/bookings/{booking_a_id}/accept", token=avail_mech_token, expect=200, label="Mechanic accepts booking A")

_, r = call("GET", "/users/profile", token=avail_mech_token, expect=200, label="Check availability after accept")
assert r["data"]["profile"]["availability_status"] == "busy", "mechanic must become BUSY after accepting a job"

call("PUT", f"/bookings/{booking_b_id}/accept", token=avail_mech_token, expect=409, label="Busy mechanic cannot accept a second booking")
call("PUT", "/mechanics/availability", token=avail_mech_token, body={"availabilityStatus": "available"}, expect=409, label="Busy mechanic cannot manually force themselves available")

_, r = call("POST", "/auth/register", body={
    "name": "Race Test Customer", "email": f"race.test.cust.{ts}@example.com", "password": "test1234",
    "phone": f"95{ts % 100000000:08d}", "role": "customer"
}, expect=201, label="Register race-condition test customer")
race_cust_token = r["data"]["token"]
_, r = call("POST", "/vehicles", token=race_cust_token, body={
    "vehicleType": "Car", "brand": "Tata", "model": "Nexon", "registrationNumber": f"KA05RC{ts % 10000:04d}"
}, expect=201, label="Race-condition test vehicle")
race_vehicle_id = r["data"]["vehicle"]["id"]
call("POST", "/bookings", token=race_cust_token, body={
    "vehicleId": race_vehicle_id, "mechanicId": avail_mech_id, "serviceId": services["Flat Tyre"],
    "problemDescription": "Testing race condition.", "locationAddress": "Test Street, Bengaluru",
    "latitude": LAT, "longitude": LNG,
}, expect=422, label="Booking creation re-checks eligibility and rejects a now-busy mechanic")

call("PUT", f"/bookings/{booking_a_id}/status", token=avail_mech_token, body={"status": "in_progress"}, expect=200, label="Mechanic starts job A")
call("PUT", f"/bookings/{booking_a_id}/status", token=avail_mech_token, body={"status": "completed"}, expect=200, label="Mechanic completes job A")

_, r = call("GET", "/users/profile", token=avail_mech_token, expect=200, label="Check availability after completion")
assert r["data"]["profile"]["availability_status"] == "available", "mechanic must be released back to AVAILABLE after completing their only active job"

call("PUT", f"/bookings/{booking_b_id}/accept", token=avail_mech_token, expect=200, label="Mechanic accepts booking B now that they are free again")
_, r = call("PUT", f"/bookings/{booking_b_id}/cancel", token=avail_cust_token, body={"reason": "Testing cancel-after-accept release"}, expect=200, label="Customer cancels accepted booking B")

_, r = call("GET", "/users/profile", token=avail_mech_token, expect=200, label="Check availability after accepted-booking cancellation")
assert r["data"]["profile"]["availability_status"] == "available", "mechanic must be released back to AVAILABLE after their accepted job is cancelled"

print("\n=== MECHANIC SELF-SERVICE ===")
call("PUT", "/mechanics/availability", token=mech_token, body={"availabilityStatus": "busy"}, expect=200, label="Mechanic updates availability")
call("PUT", "/mechanics/services", token=mech_token, body={"serviceIds": [services["Flat Tyre"], services["Engine Problem"]]}, expect=200, label="Mechanic updates services offered")
call("PUT", "/mechanics/availability", token=mech_token, body={"availabilityStatus": "available"}, expect=200, label="Mechanic sets back to available (no active job)")
_, r = call("GET", "/mechanics/earnings", token=mech_token, expect=200, label="Mechanic views earnings summary")
print("    earnings summary:", r["data"]["summary"])

print("\n=== ADMIN OPERATIONS ===")
_, r = call("GET", "/admin/stats", token=admin_token, expect=200, label="Admin dashboard stats")
print("    stats:", {k: r["data"][k] for k in ["customerCount", "mechanicCount", "pendingApprovals", "totalBookings", "totalReviews"]})

call("GET", "/admin/customers", token=admin_token, expect=200, label="Admin lists customers")
_, r = call("GET", "/admin/mechanics?status=pending", token=admin_token, expect=200, label="Admin lists pending mechanics")
pending = r["data"]["mechanics"]
assert any(m["id"] == new_mech_id for m in pending), "newly registered mechanic should be pending"

call("PUT", f"/admin/mechanics/{new_mech_id}/approve", token=admin_token, expect=200, label="Admin approves pending mechanic")
_, r = call("GET", "/mechanics", expect=200, label="Public mechanic directory unfiltered")
all_mech_ids = [m["id"] for m in r["data"]["mechanics"]]
assert new_mech_id in all_mech_ids, "approved mechanic should now appear in directory"

call("PUT", f"/admin/customers/{cust_id}/suspend", token=admin_token, expect=200, label="Admin suspends a customer")
call("POST", "/auth/login", body={"email": "rahul.sharma@example.com", "password": "password123"}, expect=403, label="Suspended customer cannot log in")
call("PUT", f"/admin/customers/{cust_id}/activate", token=admin_token, expect=200, label="Admin reactivates the customer")
call("POST", "/auth/login", body={"email": "rahul.sharma@example.com", "password": "password123"}, expect=200, label="Reactivated customer can log in again")

call("GET", "/admin/bookings", token=admin_token, expect=200, label="Admin views all bookings")
call("GET", "/admin/reviews", token=admin_token, expect=200, label="Admin views all reviews")

print(f"\n=== RESULTS: {PASS} passed, {FAIL} failed ===")
sys.exit(1 if FAIL else 0)
