const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { success } = require('../utils/response');
const { query, withTransaction } = require('../db/query');
const { rules, runValidation } = require('../validators/validate');
const { haversineDistanceKm, estimateEtaMinutes, isValidLatitude, isValidLongitude } = require('../utils/geo');

const ACTIVE_STATUSES = ['pending', 'accepted', 'in_progress'];

const DETAIL_SELECT = `
  SELECT
    b.*,
    v.brand AS vehicle_brand, v.model AS vehicle_model,
    v.registration_number AS vehicle_registration, v.vehicle_type,
    s.name AS service_name, s.base_price AS current_service_price,
    cu.name AS customer_name, cu.phone AS customer_phone,
    me.name AS mechanic_name, me.phone AS mechanic_phone,
    (SELECT COUNT(*) FROM reviews rv WHERE rv.booking_id = b.id) AS has_review
  FROM bookings b
  JOIN vehicles v ON v.id = b.vehicle_id
  JOIN services s ON s.id = b.service_id
  JOIN users cu ON cu.id = b.customer_id
  JOIN users me ON me.id = b.mechanic_id
`;

async function getBookingOr404(id) {
  const rows = await query(`${DETAIL_SELECT} WHERE b.id = ?`, [id]);
  if (rows.length === 0) throw new ApiError(404, 'Booking not found.');
  return rows[0];
}

function assertAccess(booking, user) {
  if (user.role === 'admin') return;
  if (user.role === 'customer' && booking.customer_id === user.id) return;
  if (user.role === 'mechanic' && booking.mechanic_id === user.id) return;
  throw new ApiError(403, 'You do not have access to this booking.');
}

async function releaseMechanicIfFree(conn, mechanicId) {
  const stillActive = await conn.query(
    `SELECT id FROM bookings WHERE mechanic_id = ? AND status IN ('accepted', 'in_progress')`,
    [mechanicId]
  );
  if (stillActive.length === 0) {
    await conn.query(`UPDATE mechanics SET availability_status = 'available' WHERE user_id = ?`, [mechanicId]);
  }
}

const createBooking = asyncHandler(async (req, res) => {
  const { vehicleId, mechanicId, serviceId, problemDescription, locationAddress, latitude, longitude } = req.body;
  const lat = Number(latitude);
  const lng = Number(longitude);

  runValidation([
    rules.required(vehicleId, 'Vehicle'),
    rules.required(mechanicId, 'Mechanic'),
    rules.required(serviceId, 'Service'),
    rules.required(problemDescription, 'Problem description'),
    rules.required(locationAddress, 'Location'),
    rules.required(latitude, 'Latitude'),
    rules.required(longitude, 'Longitude'),
    !isValidLatitude(lat) ? 'Latitude must be a number between -90 and 90.' : null,
    !isValidLongitude(lng) ? 'Longitude must be a number between -180 and 180.' : null,
  ]);

  const vehicle = await query('SELECT id FROM vehicles WHERE id = ? AND customer_id = ?', [vehicleId, req.user.id]);
  if (vehicle.length === 0) throw new ApiError(404, 'Vehicle not found.');

  const services = await query('SELECT id, base_price FROM services WHERE id = ? AND is_active = TRUE', [serviceId]);
  if (services.length === 0) throw new ApiError(404, 'Service not found or unavailable.');
  const service = services[0];

  const mechanics = await query(
    `SELECT m.user_id, m.latitude, m.longitude FROM mechanics m
     WHERE m.user_id = ? AND m.approval_status = 'approved' AND m.availability_status = 'available'
       AND m.user_id IN (SELECT mechanic_id FROM mechanic_services WHERE service_id = ?)`,
    [mechanicId, serviceId]
  );
  if (mechanics.length === 0) {
    throw new ApiError(422, 'Selected mechanic is no longer available for this service. Please pick another mechanic.');
  }
  const mechanic = mechanics[0];

  const duplicate = await query(
    `SELECT id FROM bookings WHERE vehicle_id = ? AND status IN ('pending','accepted','in_progress')`,
    [vehicleId]
  );
  if (duplicate.length > 0) {
    throw new ApiError(409, 'This vehicle already has an active assistance request. Cancel or complete it first.');
  }

  let distanceKm = null;
  let etaMinutes = null;
  if (mechanic.latitude !== null && mechanic.longitude !== null) {
    distanceKm = Math.round(haversineDistanceKm(lat, lng, mechanic.latitude, mechanic.longitude) * 10) / 10;
    etaMinutes = estimateEtaMinutes(distanceKm);
  }

  const [inserted] = await query(
    `INSERT INTO bookings
       (customer_id, vehicle_id, mechanic_id, service_id, problem_description, location_address,
        latitude, longitude, price_snapshot, distance_km, eta_minutes, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending') RETURNING id`,
    [req.user.id, vehicleId, mechanicId, serviceId, problemDescription.trim(), locationAddress.trim(),
     lat, lng, service.base_price, distanceKm, etaMinutes]
  );

  const booking = await getBookingOr404(inserted.id);
  success(res, 201, 'Assistance request created.', { booking });
});

const listBookings = asyncHandler(async (req, res) => {
  const { status } = req.query;
  let sql = DETAIL_SELECT + ' WHERE 1=1';
  const params = [];
  if (req.user.role === 'customer') {
    sql += ' AND b.customer_id = ?'; params.push(req.user.id);
  } else if (req.user.role === 'mechanic') {
    sql += ' AND b.mechanic_id = ?'; params.push(req.user.id);
  }
  if (status) { sql += ' AND b.status = ?'; params.push(status); }
  sql += ' ORDER BY b.requested_at DESC';
  const bookings = await query(sql, params);
  success(res, 200, 'Bookings fetched.', { bookings });
});

const getBooking = asyncHandler(async (req, res) => {
  const booking = await getBookingOr404(req.params.id);
  assertAccess(booking, req.user);
  success(res, 200, 'Booking fetched.', { booking });
});

const acceptBooking = asyncHandler(async (req, res) => {
  const booking = await getBookingOr404(req.params.id);
  assertAccess(booking, req.user);
  if (req.user.role !== 'mechanic') throw new ApiError(403, 'Only mechanics can accept requests.');
  if (booking.status !== 'pending') throw new ApiError(409, `Cannot accept a request that is already "${booking.status}".`);

  await withTransaction(async (conn) => {
    const mechRows = await conn.query(
      'SELECT availability_status, approval_status FROM mechanics WHERE user_id = ? FOR UPDATE',
      [req.user.id]
    );
    if (mechRows[0].approval_status !== 'approved') {
      // Defense-in-depth: a pending or suspended mechanic must be rejected
      // here even if they call this endpoint directly, independent of
      // whichever eligibility check the booking was originally created under.
      throw new ApiError(403, 'Your mechanic account is not approved to accept jobs.');
    }
    if (mechRows[0].availability_status !== 'available') {
      throw new ApiError(409, 'You are currently busy with another job and cannot accept new requests.');
    }
    const freshBooking = await conn.query('SELECT status FROM bookings WHERE id = ? FOR UPDATE', [booking.id]);
    if (freshBooking[0].status !== 'pending') {
      throw new ApiError(409, `Cannot accept a request that is already "${freshBooking[0].status}".`);
    }
    await conn.query(`UPDATE bookings SET status = 'accepted', accepted_at = NOW() WHERE id = ?`, [booking.id]);
    await conn.query(`UPDATE mechanics SET availability_status = 'busy' WHERE user_id = ?`, [req.user.id]);
  });

  success(res, 200, 'Request accepted.', { booking: await getBookingOr404(booking.id) });
});

const rejectBooking = asyncHandler(async (req, res) => {
  const booking = await getBookingOr404(req.params.id);
  assertAccess(booking, req.user);
  if (req.user.role !== 'mechanic') throw new ApiError(403, 'Only mechanics can reject requests.');
  if (booking.status !== 'pending') throw new ApiError(409, `Cannot reject a request that is already "${booking.status}".`);
  await query(`UPDATE bookings SET status = 'rejected' WHERE id = ?`, [booking.id]);
  success(res, 200, 'Request rejected.', { booking: await getBookingOr404(booking.id) });
});

const advanceStatus = asyncHandler(async (req, res) => {
  const booking = await getBookingOr404(req.params.id);
  assertAccess(booking, req.user);
  if (req.user.role !== 'mechanic') throw new ApiError(403, 'Only mechanics can update job status.');

  const { status: nextStatus } = req.body;
  const allowedTransitions = { accepted: 'in_progress', in_progress: 'completed' };
  const expectedNext = allowedTransitions[booking.status];
  if (!expectedNext || nextStatus !== expectedNext) {
    throw new ApiError(409, `Invalid status transition from "${booking.status}". Expected next status: "${expectedNext || 'none — this booking is already final'}".`);
  }

  const timestampColumn = nextStatus === 'in_progress' ? 'started_at' : 'completed_at';
  await withTransaction(async (conn) => {
    await conn.query(`UPDATE bookings SET status = ?, ${timestampColumn} = NOW() WHERE id = ?`, [nextStatus, booking.id]);
    if (nextStatus === 'completed') await releaseMechanicIfFree(conn, req.user.id);
  });

  success(res, 200, `Job marked as ${nextStatus.replace('_', ' ')}.`, { booking: await getBookingOr404(booking.id) });
});

const cancelBooking = asyncHandler(async (req, res) => {
  const booking = await getBookingOr404(req.params.id);
  assertAccess(booking, req.user);
  if (req.user.role !== 'customer') throw new ApiError(403, 'Only the customer can cancel a request.');

  if (!ACTIVE_STATUSES.includes(booking.status) || booking.status === 'in_progress') {
    throw new ApiError(409, `This request can no longer be cancelled (current status: "${booking.status}"). Cancellation is only allowed before work is in progress.`);
  }

  const wasAccepted = booking.status === 'accepted';
  const { reason } = req.body;
  await withTransaction(async (conn) => {
    await conn.query(`UPDATE bookings SET status = 'cancelled', cancelled_at = NOW(), cancellation_reason = ? WHERE id = ?`, [reason || null, booking.id]);
    if (wasAccepted) await releaseMechanicIfFree(conn, booking.mechanic_id);
  });

  success(res, 200, 'Request cancelled.', { booking: await getBookingOr404(booking.id) });
});

module.exports = { createBooking, listBookings, getBooking, acceptBooking, rejectBooking, advanceStatus, cancelBooking };
