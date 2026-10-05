const express = require('express');
const {
  createBooking, listBookings, getBooking, acceptBooking, rejectBooking, advanceStatus, cancelBooking,
} = require('../controllers/bookingController');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');
const router = express.Router();
router.use(requireAuth);
router.post('/', requireRole('customer'), createBooking);
router.get('/', listBookings);
router.get('/:id', getBooking);
router.put('/:id/accept', requireRole('mechanic'), acceptBooking);
router.put('/:id/reject', requireRole('mechanic'), rejectBooking);
router.put('/:id/status', requireRole('mechanic'), advanceStatus);
router.put('/:id/cancel', requireRole('customer'), cancelBooking);
module.exports = router;
