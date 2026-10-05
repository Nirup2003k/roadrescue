const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { success } = require('../utils/response');
const { query } = require('../db/query');

const getStats = asyncHandler(async (req, res) => {
  const [customerCount] = await query(`SELECT COUNT(*) AS count FROM users WHERE role = 'customer'`);
  const [mechanicCount] = await query(`SELECT COUNT(*) AS count FROM users WHERE role = 'mechanic'`);
  const [pendingApprovals] = await query(`SELECT COUNT(*) AS count FROM mechanics WHERE approval_status = 'pending'`);
  const bookingsByStatus = await query(`SELECT status, COUNT(*) AS count FROM bookings GROUP BY status`);
  const [totalBookings] = await query(`SELECT COUNT(*) AS count FROM bookings`);
  const [totalReviews] = await query(`SELECT COUNT(*) AS count FROM reviews`);
  const [avgRating] = await query(`SELECT COALESCE(ROUND(AVG(rating), 2), 0) AS avg FROM reviews`);
  const recentBookings = await query(
    `SELECT b.id, b.status, b.requested_at, s.name AS service_name, cu.name AS customer_name, me.name AS mechanic_name
     FROM bookings b JOIN services s ON s.id = b.service_id
     JOIN users cu ON cu.id = b.customer_id JOIN users me ON me.id = b.mechanic_id
     ORDER BY b.requested_at DESC LIMIT 5`
  );
  const topMechanics = await query(
    `SELECT u.id, u.name, ROUND(AVG(rv.rating), 1) AS avg_rating, COUNT(rv.id) AS review_count
     FROM reviews rv JOIN users u ON u.id = rv.mechanic_id
     GROUP BY u.id, u.name ORDER BY avg_rating DESC, review_count DESC LIMIT 5`
  );
  success(res, 200, 'Stats fetched.', {
    customerCount: customerCount.count, mechanicCount: mechanicCount.count,
    pendingApprovals: pendingApprovals.count, totalBookings: totalBookings.count,
    totalReviews: totalReviews.count, avgRating: avgRating.avg,
    bookingsByStatus, recentBookings, topMechanics,
  });
});

const listCustomers = asyncHandler(async (req, res) => {
  const { search } = req.query;
  let sql = `
    SELECT u.id, u.name, u.email, u.phone, u.status, u.created_at, c.address, c.city,
           (SELECT COUNT(*) FROM bookings b WHERE b.customer_id = u.id) AS booking_count
    FROM users u JOIN customers c ON c.user_id = u.id WHERE u.role = 'customer'`;
  const params = [];
  if (search) { sql += ' AND (u.name ILIKE ? OR u.email ILIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
  sql += ' ORDER BY u.created_at DESC';
  const customers = await query(sql, params);
  success(res, 200, 'Customers fetched.', { customers });
});

const listMechanicsAdmin = asyncHandler(async (req, res) => {
  const { search, status } = req.query;
  let sql = `
    SELECT u.id, u.name, u.email, u.phone, u.status, u.created_at,
           m.approval_status, m.availability_status, m.experience_years, m.service_area,
           COALESCE((SELECT ROUND(AVG(r.rating),1) FROM reviews r WHERE r.mechanic_id = u.id), 0) AS avg_rating,
           (SELECT COUNT(*) FROM bookings b WHERE b.mechanic_id = u.id) AS booking_count
    FROM users u JOIN mechanics m ON m.user_id = u.id WHERE u.role = 'mechanic'`;
  const params = [];
  if (search) { sql += ' AND (u.name ILIKE ? OR u.email ILIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
  if (status) { sql += ' AND m.approval_status = ?'; params.push(status); }
  sql += ' ORDER BY u.created_at DESC';
  const mechanics = await query(sql, params);
  success(res, 200, 'Mechanics fetched.', { mechanics });
});

async function assertRoleUser(id, role) {
  const rows = await query('SELECT id FROM users WHERE id = ? AND role = ?', [id, role]);
  if (rows.length === 0) throw new ApiError(404, `${role} not found.`);
}

const suspendCustomer = asyncHandler(async (req, res) => {
  await assertRoleUser(req.params.id, 'customer');
  await query(`UPDATE users SET status = 'suspended' WHERE id = ?`, [req.params.id]);
  success(res, 200, 'Customer suspended.');
});
const activateCustomer = asyncHandler(async (req, res) => {
  await assertRoleUser(req.params.id, 'customer');
  await query(`UPDATE users SET status = 'active' WHERE id = ?`, [req.params.id]);
  success(res, 200, 'Customer activated.');
});
const approveMechanic = asyncHandler(async (req, res) => {
  await assertRoleUser(req.params.id, 'mechanic');
  await query(`UPDATE mechanics SET approval_status = 'approved' WHERE user_id = ?`, [req.params.id]);
  await query(`UPDATE users SET status = 'active' WHERE id = ?`, [req.params.id]);
  success(res, 200, 'Mechanic approved.');
});
const suspendMechanic = asyncHandler(async (req, res) => {
  await assertRoleUser(req.params.id, 'mechanic');
  await query(`UPDATE mechanics SET approval_status = 'suspended' WHERE user_id = ?`, [req.params.id]);
  await query(`UPDATE users SET status = 'suspended' WHERE id = ?`, [req.params.id]);
  success(res, 200, 'Mechanic suspended.');
});
const activateMechanic = asyncHandler(async (req, res) => {
  await assertRoleUser(req.params.id, 'mechanic');
  await query(`UPDATE mechanics SET approval_status = 'approved' WHERE user_id = ?`, [req.params.id]);
  await query(`UPDATE users SET status = 'active' WHERE id = ?`, [req.params.id]);
  success(res, 200, 'Mechanic reactivated.');
});

const listAllBookings = asyncHandler(async (req, res) => {
  const { status } = req.query;
  let sql = `
    SELECT b.*, s.name AS service_name, cu.name AS customer_name, me.name AS mechanic_name,
           v.registration_number AS vehicle_registration
    FROM bookings b JOIN services s ON s.id = b.service_id
    JOIN users cu ON cu.id = b.customer_id JOIN users me ON me.id = b.mechanic_id
    JOIN vehicles v ON v.id = b.vehicle_id WHERE 1=1`;
  const params = [];
  if (status) { sql += ' AND b.status = ?'; params.push(status); }
  sql += ' ORDER BY b.requested_at DESC';
  const bookings = await query(sql, params);
  success(res, 200, 'Bookings fetched.', { bookings });
});

const listAllReviews = asyncHandler(async (req, res) => {
  const reviews = await query(
    `SELECT rv.*, cu.name AS customer_name, me.name AS mechanic_name, s.name AS service_name
     FROM reviews rv JOIN users cu ON cu.id = rv.customer_id JOIN users me ON me.id = rv.mechanic_id
     JOIN bookings b ON b.id = rv.booking_id JOIN services s ON s.id = b.service_id
     ORDER BY rv.created_at DESC`
  );
  success(res, 200, 'Reviews fetched.', { reviews });
});

const deleteReview = asyncHandler(async (req, res) => {
  const rows = await query('SELECT id FROM reviews WHERE id = ?', [req.params.id]);
  if (rows.length === 0) throw new ApiError(404, 'Review not found.');
  await query('DELETE FROM reviews WHERE id = ?', [req.params.id]);
  success(res, 200, 'Review removed.');
});

module.exports = {
  getStats, listCustomers, listMechanicsAdmin, suspendCustomer, activateCustomer,
  approveMechanic, suspendMechanic, activateMechanic, listAllBookings, listAllReviews, deleteReview,
};
