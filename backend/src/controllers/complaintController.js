const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { success } = require('../utils/response');
const { query } = require('../db/query');
const { rules, runValidation } = require('../validators/validate');

const VALID_STATUSES = ['pending', 'under_review', 'resolved', 'dismissed'];

const createComplaint = asyncHandler(async (req, res) => {
  const { bookingId, subject, description } = req.body;
  const { id: userId, role } = req.user;

  runValidation([
    rules.required(bookingId, 'Booking'),
    rules.required(subject, 'Subject'),
    rules.required(description, 'Description'),
  ]);

  if (!['customer', 'mechanic'].includes(role)) {
    throw new ApiError(403, 'Only customers or mechanics can report a complaint.');
  }

  const bookings = await query('SELECT * FROM bookings WHERE id = ?', [bookingId]);
  if (bookings.length === 0) throw new ApiError(404, 'Booking not found.');
  const booking = bookings[0];

  if (role === 'customer' && booking.customer_id !== userId) {
    throw new ApiError(403, 'You can only report a complaint for your own booking.');
  }
  if (role === 'mechanic' && booking.mechanic_id !== userId) {
    throw new ApiError(403, 'You can only report a complaint for your assigned booking.');
  }

  const [inserted] = await query(
    `INSERT INTO complaints (booking_id, reporter_id, reporter_role, subject, description, status)
     VALUES (?, ?, ?, ?, ?, 'pending') RETURNING id`,
    [bookingId, userId, role, subject.trim(), description.trim()]
  );

  const [complaint] = await query(
    `SELECT c.*, s.name AS service_name
     FROM complaints c
     JOIN bookings b ON b.id = c.booking_id
     JOIN services s ON s.id = b.service_id
     WHERE c.id = ?`,
    [inserted.id]
  );

  success(res, 201, 'Complaint submitted successfully.', { complaint });
});

const listMyComplaints = asyncHandler(async (req, res) => {
  const complaints = await query(
    `SELECT c.*, s.name AS service_name, v.brand AS vehicle_brand, v.model AS vehicle_model
     FROM complaints c
     JOIN bookings b ON b.id = c.booking_id
     JOIN services s ON s.id = b.service_id
     JOIN vehicles v ON v.id = b.vehicle_id
     WHERE c.reporter_id = ?
     ORDER BY c.created_at DESC`,
    [req.user.id]
  );
  success(res, 200, 'Your complaints fetched.', { complaints });
});

const getBookingComplaints = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  const { id: userId, role } = req.user;

  const bookings = await query('SELECT customer_id, mechanic_id FROM bookings WHERE id = ?', [bookingId]);
  if (bookings.length === 0) throw new ApiError(404, 'Booking not found.');
  const booking = bookings[0];

  if (role !== 'admin' && booking.customer_id !== userId && booking.mechanic_id !== userId) {
    throw new ApiError(403, 'Access denied.');
  }

  const complaints = await query(
    `SELECT c.*, u.name AS reporter_name
     FROM complaints c
     JOIN users u ON u.id = c.reporter_id
     WHERE c.booking_id = ?
     ORDER BY c.created_at DESC`,
    [bookingId]
  );

  success(res, 200, 'Booking complaints fetched.', { complaints });
});

const listAllComplaints = asyncHandler(async (req, res) => {
  const { status } = req.query;
  let sql = `
    SELECT c.*,
           s.name AS service_name,
           u.name AS reporter_name, u.email AS reporter_email, u.phone AS reporter_phone,
           cu.name AS customer_name, me.name AS mechanic_name
    FROM complaints c
    JOIN bookings b ON b.id = c.booking_id
    JOIN services s ON s.id = b.service_id
    JOIN users u ON u.id = c.reporter_id
    JOIN users cu ON cu.id = b.customer_id
    JOIN users me ON me.id = b.mechanic_id
    WHERE 1=1`;
  const params = [];
  if (status) {
    sql += ' AND c.status = ?';
    params.push(status);
  }
  sql += ' ORDER BY c.created_at DESC';

  const complaints = await query(sql, params);
  success(res, 200, 'Complaints fetched.', { complaints });
});

const updateComplaintStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, adminNotes } = req.body;

  runValidation([
    rules.required(status, 'Status'),
    rules.oneOf(status, 'Status', VALID_STATUSES),
  ]);

  const existing = await query('SELECT id FROM complaints WHERE id = ?', [id]);
  if (existing.length === 0) throw new ApiError(404, 'Complaint not found.');

  const [updated] = await query(
    `UPDATE complaints
     SET status = ?, admin_notes = COALESCE(?, admin_notes)
     WHERE id = ? RETURNING *`,
    [status, adminNotes ? adminNotes.trim() : null, id]
  );

  success(res, 200, 'Complaint status updated.', { complaint: updated });
});

module.exports = {
  createComplaint,
  listMyComplaints,
  getBookingComplaints,
  listAllComplaints,
  updateComplaintStatus,
};
