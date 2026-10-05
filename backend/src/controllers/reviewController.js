const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { success } = require('../utils/response');
const { query } = require('../db/query');
const { rules, runValidation } = require('../validators/validate');

const createReview = asyncHandler(async (req, res) => {
  const { bookingId, rating, comment } = req.body;
  runValidation([rules.required(bookingId, 'Booking'), rules.rating(rating)]);

  const rows = await query('SELECT * FROM bookings WHERE id = ? AND customer_id = ?', [bookingId, req.user.id]);
  if (rows.length === 0) throw new ApiError(404, 'Booking not found.');
  const booking = rows[0];
  if (booking.status !== 'completed') throw new ApiError(409, 'You can only review a completed assistance request.');

  const existing = await query('SELECT id FROM reviews WHERE booking_id = ?', [bookingId]);
  if (existing.length > 0) throw new ApiError(409, 'You have already reviewed this booking.');

  const [inserted] = await query(
    `INSERT INTO reviews (booking_id, customer_id, mechanic_id, rating, comment) VALUES (?, ?, ?, ?, ?) RETURNING id`,
    [bookingId, req.user.id, booking.mechanic_id, rating, comment || null]
  );

  const [review] = await query(
    `SELECT rv.*, s.name AS service_name FROM reviews rv
     JOIN bookings b ON b.id = rv.booking_id JOIN services s ON s.id = b.service_id WHERE rv.id = ?`,
    [inserted.id]
  );
  success(res, 201, 'Review submitted. Thank you for your feedback.', { review });
});

const listMechanicReviews = asyncHandler(async (req, res) => {
  const reviews = await query(
    `SELECT rv.id, rv.rating, rv.comment, rv.created_at, u.name AS customer_name
     FROM reviews rv JOIN users u ON u.id = rv.customer_id WHERE rv.mechanic_id = ? ORDER BY rv.created_at DESC`,
    [req.params.mechanicId]
  );
  success(res, 200, 'Reviews fetched.', { reviews });
});

const listMyReviews = asyncHandler(async (req, res) => {
  const reviews = await query(
    `SELECT rv.*, u.name AS mechanic_name, s.name AS service_name
     FROM reviews rv JOIN users u ON u.id = rv.mechanic_id
     JOIN bookings b ON b.id = rv.booking_id JOIN services s ON s.id = b.service_id
     WHERE rv.customer_id = ? ORDER BY rv.created_at DESC`,
    [req.user.id]
  );
  success(res, 200, 'Your reviews fetched.', { reviews });
});

const listReviewsReceived = asyncHandler(async (req, res) => {
  const reviews = await query(
    `SELECT rv.*, u.name AS customer_name, s.name AS service_name
     FROM reviews rv JOIN users u ON u.id = rv.customer_id
     JOIN bookings b ON b.id = rv.booking_id JOIN services s ON s.id = b.service_id
     WHERE rv.mechanic_id = ? ORDER BY rv.created_at DESC`,
    [req.user.id]
  );
  success(res, 200, 'Reviews received fetched.', { reviews });
});

module.exports = { createReview, listMechanicReviews, listMyReviews, listReviewsReceived };
