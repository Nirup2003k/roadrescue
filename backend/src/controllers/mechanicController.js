const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { success } = require('../utils/response');
const { query, withTransaction } = require('../db/query');
const { rules, runValidation } = require('../validators/validate');
const { haversineDistanceKm, estimateEtaMinutes, isValidLatitude, isValidLongitude } = require('../utils/geo');

const RATING_SELECT = `
  COALESCE((SELECT ROUND(AVG(r.rating), 1) FROM reviews r WHERE r.mechanic_id = m.user_id), 0) AS avg_rating,
  (SELECT COUNT(*) FROM reviews r WHERE r.mechanic_id = m.user_id) AS review_count
`;

const listMechanics = asyncHandler(async (req, res) => {
  const { serviceId, availableOnly } = req.query;
  let sql = `
    SELECT u.id, u.name, u.phone, m.bio, m.experience_years, m.service_area,
           m.availability_status, ${RATING_SELECT}
    FROM mechanics m JOIN users u ON u.id = m.user_id
    WHERE m.approval_status = 'approved' AND u.status = 'active'
  `;
  const params = [];
  if (serviceId) {
    sql += ` AND m.user_id IN (SELECT mechanic_id FROM mechanic_services WHERE service_id = ?)`;
    params.push(serviceId);
  }
  if (availableOnly === 'true') sql += ` AND m.availability_status = 'available'`;
  sql += ' ORDER BY avg_rating DESC, u.name ASC';

  const mechanics = await query(sql, params);
  success(res, 200, 'Mechanics fetched.', { mechanics });
});

const listNearbyMechanics = asyncHandler(async (req, res) => {
  const { lat, lng, serviceId } = req.query;
  const latitude = Number(lat);
  const longitude = Number(lng);

  runValidation([
    rules.required(lat, 'Latitude'),
    rules.required(lng, 'Longitude'),
    rules.required(serviceId, 'Service'),
    !isValidLatitude(latitude) ? 'Latitude must be a number between -90 and 90.' : null,
    !isValidLongitude(longitude) ? 'Longitude must be a number between -180 and 180.' : null,
  ]);

  const services = await query('SELECT id, base_price FROM services WHERE id = ? AND is_active = TRUE', [serviceId]);
  if (services.length === 0) throw new ApiError(404, 'Service not found or unavailable.');
  const service = services[0];

  const mechanics = await query(
    `SELECT u.id, u.name, u.phone, m.bio, m.experience_years, m.service_area,
            m.availability_status, m.latitude, m.longitude, ${RATING_SELECT}
     FROM mechanics m
     JOIN users u ON u.id = m.user_id
     WHERE m.approval_status = 'approved'
       AND m.availability_status = 'available'
       AND u.status = 'active'
       AND m.latitude IS NOT NULL AND m.longitude IS NOT NULL
       AND m.user_id IN (SELECT mechanic_id FROM mechanic_services WHERE service_id = ?)`,
    [serviceId]
  );

  const results = mechanics
    .map((m) => {
      const distanceKm = haversineDistanceKm(latitude, longitude, m.latitude, m.longitude);
      return {
        ...m,
        service_price: service.base_price,
        distance_km: Math.round(distanceKm * 10) / 10,
        estimated_arrival_minutes: estimateEtaMinutes(distanceKm),
      };
    })
    .sort((a, b) => a.distance_km - b.distance_km);

  success(res, 200, 'Nearby mechanics fetched.', { mechanics: results });
});

const getMechanic = asyncHandler(async (req, res) => {
  const rows = await query(
    `SELECT u.id, u.name, u.phone, u.status, m.bio, m.experience_years, m.service_area,
            m.availability_status, m.approval_status, ${RATING_SELECT}
     FROM mechanics m JOIN users u ON u.id = m.user_id WHERE m.user_id = ?`,
    [req.params.id]
  );
  if (rows.length === 0) throw new ApiError(404, 'Mechanic not found.');

  const services = await query(
    `SELECT s.id, s.name FROM mechanic_services ms JOIN services s ON s.id = ms.service_id WHERE ms.mechanic_id = ?`,
    [req.params.id]
  );
  const reviews = await query(
    `SELECT rv.id, rv.rating, rv.comment, rv.created_at, u.name AS customer_name
     FROM reviews rv JOIN customers c ON c.user_id = rv.customer_id
     JOIN users u ON u.id = c.user_id WHERE rv.mechanic_id = ? ORDER BY rv.created_at DESC`,
    [req.params.id]
  );
  success(res, 200, 'Mechanic fetched.', { mechanic: { ...rows[0], services, reviews } });
});

const updateAvailability = asyncHandler(async (req, res) => {
  const { availabilityStatus } = req.body;
  runValidation([
    rules.required(availabilityStatus, 'Availability status'),
    rules.oneOf(availabilityStatus, 'Availability status', ['available', 'busy', 'offline']),
  ]);

  if (availabilityStatus === 'available') {
    const active = await query(
      `SELECT id FROM bookings WHERE mechanic_id = ? AND status IN ('accepted', 'in_progress')`,
      [req.user.id]
    );
    if (active.length > 0) {
      throw new ApiError(409, 'You have an active job in progress. Availability will be restored automatically once it is completed or cancelled.');
    }
  }

  await query('UPDATE mechanics SET availability_status = ? WHERE user_id = ?', [availabilityStatus, req.user.id]);
  success(res, 200, 'Availability updated.', { availabilityStatus });
});

const updateServices = asyncHandler(async (req, res) => {
  const { serviceIds } = req.body;
  if (!Array.isArray(serviceIds)) throw new ApiError(422, 'serviceIds must be an array of service IDs.');

  await withTransaction(async (conn) => {
    await conn.query('DELETE FROM mechanic_services WHERE mechanic_id = ?', [req.user.id]);
    for (const serviceId of serviceIds) {
      await conn.query('INSERT INTO mechanic_services (mechanic_id, service_id) VALUES (?, ?)', [req.user.id, serviceId]);
    }
  });

  const services = await query(
    `SELECT s.id, s.name FROM mechanic_services ms JOIN services s ON s.id = ms.service_id WHERE ms.mechanic_id = ?`,
    [req.user.id]
  );
  success(res, 200, 'Services offered updated.', { services });
});

const getEarningsSummary = asyncHandler(async (req, res) => {
  const summary = await query(
    `SELECT COUNT(*) AS completed_jobs, COALESCE(SUM(price_snapshot), 0) AS total_earnings
     FROM bookings WHERE mechanic_id = ? AND status = 'completed'`,
    [req.user.id]
  );
  const statusCounts = await query(
    `SELECT status, COUNT(*) AS count FROM bookings WHERE mechanic_id = ? GROUP BY status`,
    [req.user.id]
  );
  success(res, 200, 'Earnings summary fetched.', { summary: summary[0], statusCounts });
});

module.exports = {
  listMechanics, listNearbyMechanics, getMechanic, updateAvailability, updateServices, getEarningsSummary,
};
